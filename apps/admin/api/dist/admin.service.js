"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;
let AdminService = class AdminService {
    data = this.createSeedData();
    storageDir = node_path_1.default.resolve(process.cwd(), 'apps/admin/api/storage');
    storageFile = node_path_1.default.join(this.storageDir, 'admin-db.json');
    tokenSecret = process.env.ADMIN_JWT_SECRET ?? 'harness-admin-demo-secret';
    async onModuleInit() {
        await this.load();
    }
    async login(email, password) {
        const user = this.data.users.find((item) => item.email === email);
        if (!user || user.status !== 'active') {
            throw new common_1.UnauthorizedException('账号不存在或已被禁用');
        }
        if (this.hashPassword(password) !== user.passwordHash) {
            throw new common_1.UnauthorizedException('账号或密码错误');
        }
        user.lastLoginAt = new Date().toISOString();
        this.appendAuditLog({
            actorUserId: user.id,
            action: 'auth.login',
            targetType: 'user',
            targetId: user.id,
            detail: `${user.name} 登录后台`,
        });
        await this.persist();
        return {
            accessToken: this.signToken({ userId: user.id, email: user.email }),
            profile: this.toSafeUser(user),
            credentials: {
                email: user.email,
                passwordHint: '默认演示账号：admin@harness.local / admin123456',
            },
        };
    }
    getCurrentUser(token) {
        const payload = this.verifyToken(token);
        const user = this.data.users.find((item) => item.id === payload.userId);
        if (!user) {
            throw new common_1.UnauthorizedException('登录态已失效');
        }
        return this.toSafeUser(user);
    }
    getDashboardOverview() {
        const now = Date.now();
        const onlineDevices = this.data.devices.filter((item) => item.status === 'online').length;
        const expiringLicenses = this.data.licenses.filter((item) => {
            return new Date(item.expiresAt).getTime() - now < 1000 * 60 * 60 * 24 * 30;
        }).length;
        return {
            metrics: [
                { label: '组织数', value: this.data.organizations.length, delta: '+1 本周' },
                { label: '用户数', value: this.data.users.length, delta: '+3 本周' },
                { label: '在线设备', value: onlineDevices, delta: '实时在线' },
                { label: '即将到期授权', value: expiringLicenses, delta: '30 天内' },
            ],
            alerts: [
                '桌面端远程配置同步已接通，当前仍为演示数据源',
                '建议下一步切换到 PostgreSQL + Prisma 持久化',
            ],
        };
    }
    listOrganizations() {
        return this.data.organizations;
    }
    listUsers() {
        return this.data.users.map((user) => this.toSafeUser(user));
    }
    async createUser(input, actorUserId) {
        const actor = this.data.users.find((item) => item.id === actorUserId);
        if (!actor) {
            throw new common_1.UnauthorizedException('无效操作者');
        }
        const email = input.email.trim().toLowerCase();
        if (this.data.users.some((item) => item.email === email)) {
            throw new common_1.UnauthorizedException('邮箱已存在');
        }
        const now = new Date().toISOString();
        const user = {
            id: (0, node_crypto_1.randomUUID)(),
            organizationId: input.organizationId,
            email,
            name: input.name,
            role: input.role,
            status: 'active',
            passwordHash: this.hashPassword(input.password),
            createdAt: now,
            lastLoginAt: undefined,
        };
        this.data.users.unshift(user);
        this.appendAuditLog({
            actorUserId,
            action: 'user.created',
            targetType: 'user',
            targetId: user.id,
            detail: `创建用户 ${user.email}`,
        });
        await this.persist();
        return this.toSafeUser(user);
    }
    async updateUserStatus(userId, status, actorUserId) {
        const user = this.data.users.find((item) => item.id === userId);
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        user.status = status;
        this.appendAuditLog({
            actorUserId,
            action: 'user.status.updated',
            targetType: 'user',
            targetId: user.id,
            detail: `将 ${user.email} 状态改为 ${status}`,
        });
        await this.persist();
        return this.toSafeUser(user);
    }
    listDevices() {
        return this.data.devices;
    }
    async registerDevice(input) {
        const device = {
            id: (0, node_crypto_1.randomUUID)(),
            deviceCode: `HARNESS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
            organizationId: input.organizationId,
            userId: input.userId,
            platform: input.platform,
            appVersion: input.appVersion,
            status: 'online',
            lastSeenAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };
        this.data.devices.unshift(device);
        this.data.syncJobs.unshift({
            id: (0, node_crypto_1.randomUUID)(),
            deviceId: device.id,
            jobType: 'device.register',
            status: 'success',
            updatedAt: new Date().toISOString(),
        });
        await this.persist();
        return device;
    }
    async heartbeat(deviceId) {
        const device = this.data.devices.find((item) => item.id === deviceId);
        if (!device) {
            throw new common_1.NotFoundException('设备不存在');
        }
        device.status = 'online';
        device.lastSeenAt = new Date().toISOString();
        this.data.syncJobs.unshift({
            id: (0, node_crypto_1.randomUUID)(),
            deviceId: device.id,
            jobType: 'device.heartbeat',
            status: 'success',
            updatedAt: new Date().toISOString(),
        });
        await this.persist();
        return device;
    }
    listLicenses() {
        return this.data.licenses;
    }
    listModelProfiles() {
        return this.data.modelProfiles;
    }
    listSystemConfigs() {
        return this.data.systemConfigs;
    }
    async updateSystemConfig(configKey, configValue, actorUserId) {
        const config = this.data.systemConfigs.find((item) => item.configKey === configKey);
        if (!config) {
            throw new common_1.NotFoundException('配置项不存在');
        }
        config.configValue = configValue;
        config.updatedAt = new Date().toISOString();
        this.appendAuditLog({
            actorUserId,
            action: 'system-config.updated',
            targetType: 'system-config',
            targetId: config.id,
            detail: `更新配置 ${configKey}`,
        });
        await this.persist();
        return config;
    }
    listAuditLogs() {
        return this.data.auditLogs;
    }
    listSyncJobs() {
        return this.data.syncJobs;
    }
    async load() {
        try {
            const file = await (0, promises_1.readFile)(this.storageFile, 'utf-8');
            this.data = JSON.parse(file);
        }
        catch {
            await this.persist();
        }
    }
    async persist() {
        await (0, promises_1.mkdir)(this.storageDir, { recursive: true });
        await (0, promises_1.writeFile)(this.storageFile, JSON.stringify(this.data, null, 2), 'utf-8');
    }
    hashPassword(password) {
        return (0, node_crypto_1.createHash)('sha256').update(password).digest('hex');
    }
    signToken(payload) {
        const body = JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_MS });
        const encodedBody = Buffer.from(body).toString('base64url');
        const signature = (0, node_crypto_1.createHmac)('sha256', this.tokenSecret).update(encodedBody).digest('base64url');
        return `${encodedBody}.${signature}`;
    }
    verifyToken(token) {
        const [encodedBody, signature] = token.split('.');
        if (!encodedBody || !signature) {
            throw new common_1.UnauthorizedException('无效令牌');
        }
        const expectedSignature = (0, node_crypto_1.createHmac)('sha256', this.tokenSecret)
            .update(encodedBody)
            .digest('base64url');
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (signatureBuffer.length !== expectedBuffer.length ||
            !(0, node_crypto_1.timingSafeEqual)(signatureBuffer, expectedBuffer)) {
            throw new common_1.UnauthorizedException('令牌校验失败');
        }
        const payload = JSON.parse(Buffer.from(encodedBody, 'base64url').toString('utf-8'));
        if (Date.now() > payload.exp) {
            throw new common_1.UnauthorizedException('登录态已过期');
        }
        return payload;
    }
    appendAuditLog(log) {
        this.data.auditLogs.unshift({
            id: (0, node_crypto_1.randomUUID)(),
            createdAt: new Date().toISOString(),
            ...log,
        });
    }
    toSafeUser(user) {
        return {
            id: user.id,
            organizationId: user.organizationId,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }
    createSeedData() {
        const now = new Date().toISOString();
        const orgId = (0, node_crypto_1.randomUUID)();
        const adminId = (0, node_crypto_1.randomUUID)();
        const deviceId = (0, node_crypto_1.randomUUID)();
        return {
            organizations: [
                {
                    id: orgId,
                    name: 'Harness 演示组织',
                    code: 'HARNESS-DEMO',
                    status: 'active',
                    createdAt: now,
                },
            ],
            users: [
                {
                    id: adminId,
                    organizationId: orgId,
                    email: 'admin@harness.local',
                    name: '平台管理员',
                    role: 'super-admin',
                    status: 'active',
                    passwordHash: this.hashPassword('admin123456'),
                    lastLoginAt: now,
                    createdAt: now,
                },
            ],
            devices: [
                {
                    id: deviceId,
                    organizationId: orgId,
                    userId: adminId,
                    deviceCode: 'HARNESS-A1B2C3',
                    platform: 'linux',
                    appVersion: '0.1.0',
                    status: 'online',
                    lastSeenAt: now,
                    createdAt: now,
                },
            ],
            licenses: [
                {
                    id: (0, node_crypto_1.randomUUID)(),
                    organizationId: orgId,
                    plan: 'Team Trial',
                    seatLimit: 20,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
                    status: 'active',
                },
            ],
            modelProfiles: [
                {
                    id: (0, node_crypto_1.randomUUID)(),
                    organizationId: orgId,
                    provider: 'OpenAI Compatible',
                    apiBaseUrl: 'https://api.example.com/v1',
                    model: 'gpt-4o-mini',
                    systemPrompt: '你是 Harness AI 的企业知识助手。',
                    enabled: true,
                    updatedAt: now,
                },
            ],
            systemConfigs: [
                {
                    id: (0, node_crypto_1.randomUUID)(),
                    organizationId: orgId,
                    configKey: 'allowExternalModel',
                    configValue: true,
                    updatedAt: now,
                },
                {
                    id: (0, node_crypto_1.randomUUID)(),
                    organizationId: orgId,
                    configKey: 'allowUploadContent',
                    configValue: false,
                    updatedAt: now,
                },
            ],
            auditLogs: [
                {
                    id: (0, node_crypto_1.randomUUID)(),
                    actorUserId: adminId,
                    action: 'system.bootstrap',
                    targetType: 'system',
                    targetId: orgId,
                    detail: '初始化后台演示数据',
                    createdAt: now,
                },
            ],
            syncJobs: [
                {
                    id: (0, node_crypto_1.randomUUID)(),
                    deviceId,
                    jobType: 'config.pull',
                    status: 'success',
                    updatedAt: now,
                },
            ],
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)()
], AdminService);
//# sourceMappingURL=admin.service.js.map