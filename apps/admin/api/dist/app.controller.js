"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const auth_guard_1 = require("./auth.guard");
let AppController = class AppController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getHealth() {
        return {
            success: true,
            data: {
                service: 'harness-admin-api',
                status: 'ok',
            },
        };
    }
    async login(body) {
        return {
            success: true,
            data: await this.adminService.login(body.email, body.password),
        };
    }
    getMe(request) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        return {
            success: true,
            data: this.adminService.getCurrentUser(token),
        };
    }
    getDashboardOverview() {
        return {
            success: true,
            data: this.adminService.getDashboardOverview(),
        };
    }
    getOrganizations() {
        return {
            success: true,
            data: this.adminService.listOrganizations(),
        };
    }
    getUsers() {
        return {
            success: true,
            data: this.adminService.listUsers(),
        };
    }
    async createUser(body) {
        return {
            success: true,
            data: await this.adminService.createUser({
                organizationId: body.organizationId,
                email: body.email,
                name: body.name,
                role: body.role,
                password: body.password,
            }, body.actorUserId),
        };
    }
    async updateUserStatus(id, body) {
        return {
            success: true,
            data: await this.adminService.updateUserStatus(id, body.status, body.actorUserId),
        };
    }
    getDevices() {
        return {
            success: true,
            data: this.adminService.listDevices(),
        };
    }
    async registerDevice(body) {
        return {
            success: true,
            data: await this.adminService.registerDevice(body),
        };
    }
    async heartbeat(body) {
        return {
            success: true,
            data: await this.adminService.heartbeat(body.deviceId),
        };
    }
    getLicenses() {
        return {
            success: true,
            data: this.adminService.listLicenses(),
        };
    }
    getModelProfiles() {
        return {
            success: true,
            data: this.adminService.listModelProfiles(),
        };
    }
    getSystemConfigs() {
        return {
            success: true,
            data: this.adminService.listSystemConfigs(),
        };
    }
    async updateSystemConfig(key, body) {
        return {
            success: true,
            data: await this.adminService.updateSystemConfig(key, body.value, body.actorUserId),
        };
    }
    getAuditLogs() {
        return {
            success: true,
            data: this.adminService.listAuditLogs(),
        };
    }
    getSyncJobs() {
        return {
            success: true,
            data: this.adminService.listSyncJobs(),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('auth/me'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('dashboard/overview'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getDashboardOverview", null);
__decorate([
    (0, common_1.Get)('organizations'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getOrganizations", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/status'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Post)('devices/register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Post)('devices/heartbeat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Get)('licenses'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getLicenses", null);
__decorate([
    (0, common_1.Get)('model-profiles'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getModelProfiles", null);
__decorate([
    (0, common_1.Get)('system-configs'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getSystemConfigs", null);
__decorate([
    (0, common_1.Put)('system-configs/:key'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateSystemConfig", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('sync-jobs'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getSyncJobs", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AppController);
//# sourceMappingURL=app.controller.js.map