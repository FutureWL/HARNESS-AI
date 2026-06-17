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
    async createModelProfile(input, actorUserId) {
        const user = this.requireUser(actorUserId);
        if (!input.provider?.trim() || !input.apiBaseUrl?.trim() || !input.model?.trim()) {
            throw new common_1.UnauthorizedException('provider / apiBaseUrl / model 均不能为空');
        }
        const profile = {
            id: (0, node_crypto_1.randomUUID)(),
            organizationId: user.organizationId,
            provider: input.provider.trim(),
            apiBaseUrl: input.apiBaseUrl.trim(),
            apiKey: input.apiKey?.trim() || undefined,
            model: input.model.trim(),
            systemPrompt: input.systemPrompt?.trim() || '',
            enabled: input.enabled ?? true,
            updatedAt: new Date().toISOString(),
        };
        this.data.modelProfiles.unshift(profile);
        this.appendAuditLog({
            actorUserId,
            action: 'model-profile.created',
            targetType: 'model-profile',
            targetId: profile.id,
            detail: `创建模型配置《${profile.provider} · ${profile.model}》`,
        });
        await this.persist();
        return profile;
    }
    async updateModelProfile(id, patch, actorUserId) {
        const user = this.requireUser(actorUserId);
        const profile = this.data.modelProfiles.find((p) => p.id === id);
        if (!profile || profile.organizationId !== user.organizationId) {
            throw new common_1.NotFoundException('模型配置不存在');
        }
        if (patch.provider !== undefined)
            profile.provider = patch.provider.trim();
        if (patch.apiBaseUrl !== undefined)
            profile.apiBaseUrl = patch.apiBaseUrl.trim();
        if (patch.apiKey !== undefined) {
            profile.apiKey = patch.apiKey === null ? undefined : patch.apiKey.trim() || undefined;
        }
        if (patch.model !== undefined)
            profile.model = patch.model.trim();
        if (patch.systemPrompt !== undefined)
            profile.systemPrompt = patch.systemPrompt.trim();
        if (patch.enabled !== undefined)
            profile.enabled = patch.enabled;
        profile.updatedAt = new Date().toISOString();
        this.appendAuditLog({
            actorUserId,
            action: 'model-profile.updated',
            targetType: 'model-profile',
            targetId: profile.id,
            detail: `更新模型配置《${profile.provider} · ${profile.model}》`,
        });
        await this.persist();
        return profile;
    }
    async deleteModelProfile(id, actorUserId) {
        const user = this.requireUser(actorUserId);
        const profile = this.data.modelProfiles.find((p) => p.id === id);
        if (!profile || profile.organizationId !== user.organizationId) {
            throw new common_1.NotFoundException('模型配置不存在');
        }
        this.data.modelProfiles = this.data.modelProfiles.filter((p) => p.id !== id);
        this.appendAuditLog({
            actorUserId,
            action: 'model-profile.deleted',
            targetType: 'model-profile',
            targetId: id,
            detail: `删除模型配置《${profile.provider} · ${profile.model}》`,
        });
        await this.persist();
        return { id };
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
    listChatSessions(userId) {
        return this.data.chatSessions
            .filter((session) => session.userId === userId)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    getChatSession(sessionId, userId) {
        const session = this.data.chatSessions.find((item) => item.id === sessionId);
        if (!session || session.userId !== userId) {
            throw new common_1.NotFoundException('会话不存在');
        }
        return session;
    }
    async createChatSession(input, actorUserId) {
        const user = this.requireUser(actorUserId);
        const profile = input.modelProfileId
            ? this.data.modelProfiles.find((item) => item.id === input.modelProfileId && item.organizationId === user.organizationId)
            : this.data.modelProfiles.find((item) => item.organizationId === user.organizationId && item.enabled);
        const now = new Date().toISOString();
        const session = {
            id: (0, node_crypto_1.randomUUID)(),
            userId: user.id,
            organizationId: user.organizationId,
            title: input.title?.trim() || '新会话',
            modelProfileId: profile?.id,
            createdAt: now,
            updatedAt: now,
        };
        this.data.chatSessions.unshift(session);
        this.appendAuditLog({
            actorUserId: user.id,
            action: 'chat.session.created',
            targetType: 'chat-session',
            targetId: session.id,
            detail: `创建会话《${session.title}》`,
        });
        await this.persist();
        return session;
    }
    async deleteChatSession(sessionId, actorUserId) {
        const session = this.getChatSession(sessionId, actorUserId);
        this.data.chatSessions = this.data.chatSessions.filter((item) => item.id !== sessionId);
        this.data.chatMessages = this.data.chatMessages.filter((item) => item.sessionId !== sessionId);
        this.appendAuditLog({
            actorUserId,
            action: 'chat.session.deleted',
            targetType: 'chat-session',
            targetId: sessionId,
            detail: `删除会话《${session.title}》`,
        });
        await this.persist();
        return { id: sessionId };
    }
    listChatMessages(sessionId, actorUserId) {
        this.getChatSession(sessionId, actorUserId);
        return this.data.chatMessages
            .filter((item) => item.sessionId === sessionId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    async postChatMessage(sessionId, content, actorUserId) {
        const session = this.getChatSession(sessionId, actorUserId);
        const user = this.requireUser(actorUserId);
        const profile = session.modelProfileId
            ? this.data.modelProfiles.find((item) => item.id === session.modelProfileId) ?? null
            : this.data.modelProfiles.find((item) => item.organizationId === user.organizationId && item.enabled) ?? null;
        const trimmed = content.trim();
        if (!trimmed) {
            throw new common_1.UnauthorizedException('消息内容不能为空');
        }
        const now = new Date().toISOString();
        const userMessage = {
            id: (0, node_crypto_1.randomUUID)(),
            sessionId,
            userId: user.id,
            role: 'user',
            content: trimmed,
            citations: [],
            createdAt: now,
        };
        this.data.chatMessages.push(userMessage);
        const history = this.listChatMessages(sessionId, actorUserId);
        const { reply, mocked } = await this.callModel(profile, history, trimmed);
        const assistantMessage = {
            id: (0, node_crypto_1.randomUUID)(),
            sessionId,
            userId: user.id,
            role: 'assistant',
            content: reply,
            citations: [],
            createdAt: new Date().toISOString(),
        };
        this.data.chatMessages.push(assistantMessage);
        session.updatedAt = assistantMessage.createdAt;
        if (session.title === '新会话') {
            session.title = trimmed.slice(0, 24);
            session.updatedAt = assistantMessage.createdAt;
        }
        this.appendAuditLog({
            actorUserId: user.id,
            action: mocked ? 'chat.message.mock' : 'chat.message.completed',
            targetType: 'chat-session',
            targetId: sessionId,
            detail: mocked
                ? `未配置可用模型，已返回模拟回复 (${trimmed.slice(0, 24)})`
                : `调用 ${profile?.model ?? 'unknown'} 回复 (${trimmed.slice(0, 24)})`,
        });
        await this.persist();
        return { userMessage, assistantMessage, model: profile, mocked };
    }
    listAgents(actorUserId) {
        const user = this.requireUser(actorUserId);
        return this.data.agents
            .filter((agent) => agent.userId === user.id)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    getAgent(agentId, actorUserId) {
        const agent = this.requireAgent(agentId, actorUserId);
        return agent;
    }
    async createAgent(input, actorUserId) {
        const user = this.requireUser(actorUserId);
        if (!input.name?.trim()) {
            throw new common_1.UnauthorizedException('智能体名称不能为空');
        }
        if (!input.systemPrompt?.trim()) {
            throw new common_1.UnauthorizedException('后端定义（systemPrompt）不能为空');
        }
        if (input.modelProfileId) {
            const profile = this.data.modelProfiles.find((p) => p.id === input.modelProfileId);
            if (!profile || profile.organizationId !== user.organizationId) {
                throw new common_1.UnauthorizedException('选择的模型配置不存在或不属于当前组织');
            }
        }
        const now = new Date().toISOString();
        const agent = {
            id: (0, node_crypto_1.randomUUID)(),
            userId: user.id,
            organizationId: user.organizationId,
            name: input.name.trim(),
            avatar: input.avatar?.trim() || '🤖',
            description: input.description?.trim() || '',
            systemPrompt: input.systemPrompt.trim(),
            welcomeMessage: input.welcomeMessage?.trim() || `你好，我是 ${input.name.trim()}，请问需要什么帮助？`,
            modelProfileId: input.modelProfileId,
            temperature: this.clampNumber(input.temperature ?? 0.7, 0, 2),
            maxTokens: this.clampNumber(input.maxTokens ?? 1024, 64, 32768),
            topP: this.clampNumber(input.topP ?? 1, 0, 1),
            status: input.status ?? 'active',
            createdAt: now,
            updatedAt: now,
        };
        this.data.agents.unshift(agent);
        this.appendAuditLog({
            actorUserId: user.id,
            action: 'agent.created',
            targetType: 'agent',
            targetId: agent.id,
            detail: `创建智能体《${agent.name}》`,
        });
        await this.persist();
        return agent;
    }
    async updateAgent(agentId, patch, actorUserId) {
        const agent = this.requireAgent(agentId, actorUserId);
        if (patch.name !== undefined) {
            const trimmed = patch.name.trim();
            if (!trimmed)
                throw new common_1.UnauthorizedException('智能体名称不能为空');
            agent.name = trimmed;
        }
        if (patch.avatar !== undefined)
            agent.avatar = patch.avatar.trim() || agent.avatar;
        if (patch.description !== undefined)
            agent.description = patch.description.trim();
        if (patch.systemPrompt !== undefined) {
            const trimmed = patch.systemPrompt.trim();
            if (!trimmed)
                throw new common_1.UnauthorizedException('后端定义不能为空');
            agent.systemPrompt = trimmed;
        }
        if (patch.welcomeMessage !== undefined)
            agent.welcomeMessage = patch.welcomeMessage.trim();
        if (patch.modelProfileId !== undefined) {
            if (patch.modelProfileId === null) {
                agent.modelProfileId = undefined;
            }
            else {
                const profile = this.data.modelProfiles.find((p) => p.id === patch.modelProfileId);
                if (!profile || profile.organizationId !== agent.organizationId) {
                    throw new common_1.UnauthorizedException('选择的模型配置不存在或不属于当前组织');
                }
                agent.modelProfileId = patch.modelProfileId;
            }
        }
        if (patch.temperature !== undefined)
            agent.temperature = this.clampNumber(patch.temperature, 0, 2);
        if (patch.maxTokens !== undefined)
            agent.maxTokens = this.clampNumber(patch.maxTokens, 64, 32768);
        if (patch.topP !== undefined)
            agent.topP = this.clampNumber(patch.topP, 0, 1);
        if (patch.status !== undefined)
            agent.status = patch.status;
        agent.updatedAt = new Date().toISOString();
        this.appendAuditLog({
            actorUserId,
            action: 'agent.updated',
            targetType: 'agent',
            targetId: agent.id,
            detail: `更新智能体《${agent.name}》`,
        });
        await this.persist();
        return agent;
    }
    async deleteAgent(agentId, actorUserId) {
        const agent = this.requireAgent(agentId, actorUserId);
        this.data.agents = this.data.agents.filter((item) => item.id !== agentId);
        this.data.agentSessions = this.data.agentSessions.filter((item) => item.agentId !== agentId);
        this.data.agentMessages = this.data.agentMessages.filter((item) => item.agentId !== agentId);
        this.appendAuditLog({
            actorUserId,
            action: 'agent.deleted',
            targetType: 'agent',
            targetId: agentId,
            detail: `删除智能体《${agent.name}》`,
        });
        await this.persist();
        return { id: agentId };
    }
    async duplicateAgent(agentId, actorUserId) {
        const source = this.requireAgent(agentId, actorUserId);
        const now = new Date().toISOString();
        const copy = {
            ...source,
            id: (0, node_crypto_1.randomUUID)(),
            name: `${source.name} - 副本`,
            status: 'disabled',
            createdAt: now,
            updatedAt: now,
        };
        this.data.agents.unshift(copy);
        this.appendAuditLog({
            actorUserId,
            action: 'agent.duplicated',
            targetType: 'agent',
            targetId: copy.id,
            detail: `从《${source.name}》复制出智能体`,
        });
        await this.persist();
        return copy;
    }
    listAgentSessions(agentId, actorUserId) {
        this.requireAgent(agentId, actorUserId);
        return this.data.agentSessions
            .filter((session) => session.agentId === agentId && session.userId === actorUserId)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async createAgentSession(agentId, input, actorUserId) {
        const agent = this.requireAgent(agentId, actorUserId);
        if (agent.status !== 'active') {
            throw new common_1.UnauthorizedException('该智能体已停用，不能开启新会话');
        }
        const now = new Date().toISOString();
        const session = {
            id: (0, node_crypto_1.randomUUID)(),
            agentId,
            userId: actorUserId,
            organizationId: agent.organizationId,
            title: input.title?.trim() || `与《${agent.name}》的对话`,
            createdAt: now,
            updatedAt: now,
        };
        this.data.agentSessions.unshift(session);
        this.appendAuditLog({
            actorUserId,
            action: 'agent.session.created',
            targetType: 'agent-session',
            targetId: session.id,
            detail: `创建智能体会话《${session.title}》`,
        });
        await this.persist();
        return { session, agent, welcomeMessage: agent.welcomeMessage };
    }
    getAgentSessionDetail(sessionId, actorUserId) {
        const session = this.data.agentSessions.find((item) => item.id === sessionId);
        if (!session || session.userId !== actorUserId) {
            throw new common_1.NotFoundException('会话不存在');
        }
        const agent = this.data.agents.find((item) => item.id === session.agentId);
        if (!agent) {
            throw new common_1.NotFoundException('智能体不存在');
        }
        return {
            session,
            agent,
            messages: this.data.agentMessages
                .filter((item) => item.sessionId === sessionId)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        };
    }
    async deleteAgentSession(sessionId, actorUserId) {
        const session = this.data.agentSessions.find((item) => item.id === sessionId);
        if (!session || session.userId !== actorUserId) {
            throw new common_1.NotFoundException('会话不存在');
        }
        this.data.agentSessions = this.data.agentSessions.filter((item) => item.id !== sessionId);
        this.data.agentMessages = this.data.agentMessages.filter((item) => item.sessionId !== sessionId);
        this.appendAuditLog({
            actorUserId,
            action: 'agent.session.deleted',
            targetType: 'agent-session',
            targetId: sessionId,
            detail: `删除智能体会话`,
        });
        await this.persist();
        return { id: sessionId };
    }
    async postAgentMessage(sessionId, content, actorUserId) {
        const session = this.data.agentSessions.find((item) => item.id === sessionId);
        if (!session || session.userId !== actorUserId) {
            throw new common_1.NotFoundException('会话不存在');
        }
        const agent = this.data.agents.find((item) => item.id === session.agentId);
        if (!agent) {
            throw new common_1.NotFoundException('智能体不存在');
        }
        if (agent.status !== 'active') {
            throw new common_1.UnauthorizedException('该智能体已被停用');
        }
        const trimmed = content.trim();
        if (!trimmed) {
            throw new common_1.UnauthorizedException('消息内容不能为空');
        }
        const profile = agent.modelProfileId
            ? this.data.modelProfiles.find((p) => p.id === agent.modelProfileId) ?? null
            : this.data.modelProfiles.find((p) => p.organizationId === agent.organizationId && p.enabled) ?? null;
        const history = this.data.agentMessages
            .filter((item) => item.sessionId === sessionId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const now = new Date().toISOString();
        const userMessage = {
            id: (0, node_crypto_1.randomUUID)(),
            sessionId,
            agentId: agent.id,
            userId: actorUserId,
            role: 'user',
            content: trimmed,
            citations: [],
            createdAt: now,
        };
        this.data.agentMessages.push(userMessage);
        const messagesForLLM = [
            { role: 'system', content: agent.systemPrompt },
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: trimmed },
        ];
        const { reply, mocked } = await this.callModelForAgent(profile, messagesForLLM, agent, trimmed);
        const assistantMessage = {
            id: (0, node_crypto_1.randomUUID)(),
            sessionId,
            agentId: agent.id,
            userId: actorUserId,
            role: 'assistant',
            content: reply,
            citations: [],
            createdAt: new Date().toISOString(),
        };
        this.data.agentMessages.push(assistantMessage);
        session.updatedAt = assistantMessage.createdAt;
        if (session.title === `与《${agent.name}》的对话`) {
            session.title = trimmed.slice(0, 24);
        }
        this.appendAuditLog({
            actorUserId,
            action: mocked ? 'agent.message.mock' : 'agent.message.completed',
            targetType: 'agent-session',
            targetId: sessionId,
            detail: mocked
                ? `智能体《${agent.name}》未配置模型，返回模拟回复`
                : `智能体《${agent.name}》调用 ${profile?.model ?? 'unknown'} 回复`,
        });
        await this.persist();
        return { userMessage, assistantMessage, agent, model: profile, mocked };
    }
    requireUser(userId) {
        const user = this.data.users.find((item) => item.id === userId);
        if (!user) {
            throw new common_1.UnauthorizedException('无效操作者');
        }
        return user;
    }
    requireAgent(agentId, actorUserId) {
        const user = this.requireUser(actorUserId);
        const agent = this.data.agents.find((item) => item.id === agentId && item.userId === user.id);
        if (!agent) {
            throw new common_1.NotFoundException('智能体不存在');
        }
        return agent;
    }
    clampNumber(value, min, max) {
        if (Number.isNaN(value))
            return min;
        return Math.min(max, Math.max(min, value));
    }
    async callModelForAgent(profile, messages, agent, latest) {
        if (!profile || !profile.enabled) {
            return { reply: this.agentMockReply(agent, latest), mocked: true };
        }
        const apiKey = (profile.apiKey ?? process.env.OPENAI_API_KEY ?? '').trim();
        if (!apiKey) {
            return { reply: this.agentMockReply(agent, latest), mocked: true };
        }
        const baseUrl = profile.apiBaseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
        const body = {
            model: profile.model || 'gpt-4o-mini',
            messages,
            temperature: agent.temperature,
            max_tokens: agent.maxTokens,
            top_p: agent.topP,
            stream: false,
        };
        try {
            const res = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                return {
                    reply: `调用模型失败 (HTTP ${res.status})，已回落为模拟回复：${this.agentMockReply(agent, latest)}`,
                    mocked: true,
                };
            }
            const json = (await res.json());
            const reply = json.choices?.[0]?.message?.content?.trim();
            return { reply: reply || this.agentMockReply(agent, latest), mocked: !reply };
        }
        catch (error) {
            return {
                reply: `调用模型出错：${error instanceof Error ? error.message : String(error)}\n模拟回复：${this.agentMockReply(agent, latest)}`,
                mocked: true,
            };
        }
    }
    agentMockReply(agent, prompt) {
        const stamp = new Date().toLocaleString('zh-CN', { hour12: false });
        const echo = prompt.length > 80 ? `${prompt.slice(0, 80)}…` : prompt;
        const systemPromptHint = agent.systemPrompt.length > 60
            ? `${agent.systemPrompt.slice(0, 60)}…`
            : agent.systemPrompt;
        return [
            `【${agent.name} · 演示模式】未配置 OPENAI_API_KEY，已返回模拟回答。`,
            `作为智能体，我的后端定义为：${systemPromptHint}`,
            `收到你的问题：${echo}`,
            `温度=${agent.temperature.toFixed(2)}  max_tokens=${agent.maxTokens}  top_p=${agent.topP.toFixed(2)}`,
            `时间：${stamp}`,
        ].join('\n');
    }
    async callModel(profile, history, latest) {
        if (!profile || !profile.enabled) {
            return { reply: this.mockReply(latest), mocked: true };
        }
        const apiKey = (profile.apiKey ?? process.env.OPENAI_API_KEY ?? '').trim();
        if (!apiKey) {
            return { reply: this.mockReply(latest), mocked: true };
        }
        const baseUrl = profile.apiBaseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
        const messages = [
            ...(profile.systemPrompt ? [{ role: 'system', content: profile.systemPrompt }] : []),
            ...history.map((item) => ({ role: item.role, content: item.content })),
            { role: 'user', content: latest },
        ];
        try {
            const res = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: profile.model || 'gpt-4o-mini',
                    messages,
                    stream: false,
                }),
            });
            if (!res.ok) {
                return {
                    reply: `调用模型失败 (HTTP ${res.status})，已回落为模拟回复：${this.mockReply(latest)}`,
                    mocked: true,
                };
            }
            const json = (await res.json());
            const reply = json.choices?.[0]?.message?.content?.trim();
            return {
                reply: reply || this.mockReply(latest),
                mocked: !reply,
            };
        }
        catch (error) {
            return {
                reply: `调用模型出错：${error instanceof Error ? error.message : String(error)}\n模拟回复：${this.mockReply(latest)}`,
                mocked: true,
            };
        }
    }
    mockReply(prompt) {
        const stamp = new Date().toLocaleString('zh-CN', { hour12: false });
        const echo = prompt.length > 80 ? `${prompt.slice(0, 80)}…` : prompt;
        return [
            `【演示模式】当前未配置可用的 OPENAI_API_KEY，平台已自动返回模拟回答。`,
            `收到你的问题：${echo}`,
            `系统提示：这是 Harness AI 平台 chat 端点的占位输出，便于演示用户隔离与历史持久化。`,
            `服务时间：${stamp}`,
        ].join('\n');
    }
    async load() {
        try {
            const file = await (0, promises_1.readFile)(this.storageFile, 'utf-8');
            const parsed = JSON.parse(file);
            this.data = this.mergeSeed(this.createSeedData(), parsed);
        }
        catch {
            await this.persist();
        }
    }
    mergeSeed(seed, override) {
        return {
            organizations: override.organizations ?? seed.organizations,
            users: override.users ?? seed.users,
            devices: override.devices ?? seed.devices,
            licenses: override.licenses ?? seed.licenses,
            modelProfiles: override.modelProfiles ?? seed.modelProfiles,
            systemConfigs: override.systemConfigs ?? seed.systemConfigs,
            auditLogs: override.auditLogs ?? seed.auditLogs,
            syncJobs: override.syncJobs ?? seed.syncJobs,
            chatSessions: override.chatSessions ?? [],
            chatMessages: override.chatMessages ?? [],
            agents: override.agents ?? [],
            agentSessions: override.agentSessions ?? [],
            agentMessages: override.agentMessages ?? [],
        };
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
            chatSessions: [],
            chatMessages: [],
            agents: [],
            agentSessions: [],
            agentMessages: [],
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)()
], AdminService);
//# sourceMappingURL=admin.service.js.map