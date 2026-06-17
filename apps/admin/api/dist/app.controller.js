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
    async createModelProfile(request, body) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.createModelProfile(body, payload.id),
        };
    }
    async updateModelProfile(request, id, body) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.updateModelProfile(id, body, payload.id),
        };
    }
    async deleteModelProfile(request, id) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.deleteModelProfile(id, payload.id),
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
    async listAgents(request) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: this.adminService.listAgents(payload.id),
        };
    }
    async getAgent(request, id) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: this.adminService.getAgent(id, payload.id),
        };
    }
    async createAgent(request, body) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.createAgent(body, payload.id),
        };
    }
    async updateAgent(request, id, body) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.updateAgent(id, body, payload.id),
        };
    }
    async deleteAgent(request, id) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.deleteAgent(id, payload.id),
        };
    }
    async duplicateAgent(request, id) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.duplicateAgent(id, payload.id),
        };
    }
    async listAgentSessions(request, id) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: this.adminService.listAgentSessions(id, payload.id),
        };
    }
    async createAgentSession(request, id, body) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        const result = await this.adminService.createAgentSession(id, body, payload.id);
        return { success: true, data: result };
    }
    async getAgentSession(request, sessionId) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: this.adminService.getAgentSessionDetail(sessionId, payload.id),
        };
    }
    async deleteAgentSession(request, sessionId) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.deleteAgentSession(sessionId, payload.id),
        };
    }
    async postAgentMessage(request, sessionId, body) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        const result = await this.adminService.postAgentMessage(sessionId, body.content, payload.id);
        return {
            success: true,
            data: {
                userMessage: result.userMessage,
                assistantMessage: result.assistantMessage,
                agent: result.agent,
                model: result.model
                    ? {
                        id: result.model.id,
                        provider: result.model.provider,
                        model: result.model.model,
                        apiBaseUrl: result.model.apiBaseUrl,
                    }
                    : null,
                mocked: result.mocked,
            },
        };
    }
    getChatProfiles() {
        return {
            success: true,
            data: this.adminService.listModelProfiles(),
        };
    }
    async listChatSessions(request) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: this.adminService.listChatSessions(payload.id),
        };
    }
    async createChatSession(request, body) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.createChatSession(body, payload.id),
        };
    }
    async getChatSession(request, id) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        const session = this.adminService.getChatSession(id, payload.id);
        return {
            success: true,
            data: {
                ...session,
                messages: this.adminService.listChatMessages(id, payload.id),
            },
        };
    }
    async deleteChatSession(request, id) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        return {
            success: true,
            data: await this.adminService.deleteChatSession(id, payload.id),
        };
    }
    async postChatMessage(request, id, body) {
        const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
        const payload = this.adminService.getCurrentUser(token);
        const result = await this.adminService.postChatMessage(id, body.content, payload.id);
        return {
            success: true,
            data: {
                session: this.adminService.getChatSession(id, payload.id),
                userMessage: result.userMessage,
                assistantMessage: result.assistantMessage,
                model: result.model
                    ? {
                        id: result.model.id,
                        provider: result.model.provider,
                        model: result.model.model,
                        apiBaseUrl: result.model.apiBaseUrl,
                    }
                    : null,
                mocked: result.mocked,
            },
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
    (0, common_1.Post)('model-profiles'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createModelProfile", null);
__decorate([
    (0, common_1.Patch)('model-profiles/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateModelProfile", null);
__decorate([
    (0, common_1.Delete)('model-profiles/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteModelProfile", null);
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
__decorate([
    (0, common_1.Get)('agents'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "listAgents", null);
__decorate([
    (0, common_1.Get)('agents/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAgent", null);
__decorate([
    (0, common_1.Post)('agents'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Patch)('agents/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Delete)('agents/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAgent", null);
__decorate([
    (0, common_1.Post)('agents/:id/duplicate'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "duplicateAgent", null);
__decorate([
    (0, common_1.Get)('agents/:id/sessions'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "listAgentSessions", null);
__decorate([
    (0, common_1.Post)('agents/:id/sessions'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAgentSession", null);
__decorate([
    (0, common_1.Get)('agents/:id/sessions/:sessionId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAgentSession", null);
__decorate([
    (0, common_1.Delete)('agents/:id/sessions/:sessionId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAgentSession", null);
__decorate([
    (0, common_1.Post)('agents/:id/sessions/:sessionId/messages'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "postAgentMessage", null);
__decorate([
    (0, common_1.Get)('chat/profiles'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getChatProfiles", null);
__decorate([
    (0, common_1.Get)('chat/sessions'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "listChatSessions", null);
__decorate([
    (0, common_1.Post)('chat/sessions'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createChatSession", null);
__decorate([
    (0, common_1.Get)('chat/sessions/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getChatSession", null);
__decorate([
    (0, common_1.Delete)('chat/sessions/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteChatSession", null);
__decorate([
    (0, common_1.Post)('chat/sessions/:id/messages'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "postChatMessage", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AppController);
//# sourceMappingURL=app.controller.js.map