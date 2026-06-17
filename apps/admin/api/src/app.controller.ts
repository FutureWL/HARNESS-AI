import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'

import { AdminService } from './admin.service'
import { AuthGuard } from './auth.guard'

type RequestWithHeaders = {
  headers: Record<string, string | undefined>
}

@Controller()
export class AppController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  getHealth() {
    return {
      success: true,
      data: {
        service: 'harness-admin-api',
        status: 'ok',
      },
    }
  }

  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    return {
      success: true,
      data: await this.adminService.login(body.email, body.password),
    }
  }

  @Get('auth/me')
  @UseGuards(AuthGuard)
  getMe(@Req() request: RequestWithHeaders) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    return {
      success: true,
      data: this.adminService.getCurrentUser(token),
    }
  }

  @Get('dashboard/overview')
  @UseGuards(AuthGuard)
  getDashboardOverview() {
    return {
      success: true,
      data: this.adminService.getDashboardOverview(),
    }
  }

  @Get('organizations')
  @UseGuards(AuthGuard)
  getOrganizations() {
    return {
      success: true,
      data: this.adminService.listOrganizations(),
    }
  }

  @Get('users')
  @UseGuards(AuthGuard)
  getUsers() {
    return {
      success: true,
      data: this.adminService.listUsers(),
    }
  }

  @Post('users')
  @UseGuards(AuthGuard)
  async createUser(
    @Body()
    body: {
      organizationId: string
      email: string
      name: string
      role: 'super-admin' | 'org-admin' | 'ops' | 'end-user'
      password: string
      actorUserId: string
    },
  ) {
    return {
      success: true,
      data: await this.adminService.createUser(
        {
          organizationId: body.organizationId,
          email: body.email,
          name: body.name,
          role: body.role,
          password: body.password,
        },
        body.actorUserId,
      ),
    }
  }

  @Patch('users/:id/status')
  @UseGuards(AuthGuard)
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'disabled'; actorUserId: string },
  ) {
    return {
      success: true,
      data: await this.adminService.updateUserStatus(id, body.status, body.actorUserId),
    }
  }

  @Get('devices')
  @UseGuards(AuthGuard)
  getDevices() {
    return {
      success: true,
      data: this.adminService.listDevices(),
    }
  }

  @Post('devices/register')
  async registerDevice(
    @Body()
    body: {
      organizationId: string
      userId?: string
      platform: 'windows' | 'macos' | 'linux'
      appVersion: string
    },
  ) {
    return {
      success: true,
      data: await this.adminService.registerDevice(body),
    }
  }

  @Post('devices/heartbeat')
  async heartbeat(@Body() body: { deviceId: string }) {
    return {
      success: true,
      data: await this.adminService.heartbeat(body.deviceId),
    }
  }

  @Get('licenses')
  @UseGuards(AuthGuard)
  getLicenses() {
    return {
      success: true,
      data: this.adminService.listLicenses(),
    }
  }

  @Get('model-profiles')
  @UseGuards(AuthGuard)
  getModelProfiles() {
    return {
      success: true,
      data: this.adminService.listModelProfiles(),
    }
  }

  @Post('model-profiles')
  @UseGuards(AuthGuard)
  async createModelProfile(
    @Req() request: RequestWithHeaders,
    @Body()
    body: {
      provider: string
      apiBaseUrl: string
      apiKey?: string
      model: string
      systemPrompt?: string
      enabled?: boolean
    },
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.createModelProfile(body, payload.id),
    }
  }

  @Patch('model-profiles/:id')
  @UseGuards(AuthGuard)
  async updateModelProfile(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body()
    body: {
      provider?: string
      apiBaseUrl?: string
      apiKey?: string | null
      model?: string
      systemPrompt?: string
      enabled?: boolean
    },
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.updateModelProfile(id, body, payload.id),
    }
  }

  @Delete('model-profiles/:id')
  @UseGuards(AuthGuard)
  async deleteModelProfile(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.deleteModelProfile(id, payload.id),
    }
  }

  @Get('system-configs')
  @UseGuards(AuthGuard)
  getSystemConfigs() {
    return {
      success: true,
      data: this.adminService.listSystemConfigs(),
    }
  }

  @Put('system-configs/:key')
  @UseGuards(AuthGuard)
  async updateSystemConfig(
    @Param('key') key: string,
    @Body() body: { value: string | boolean | number; actorUserId: string },
  ) {
    return {
      success: true,
      data: await this.adminService.updateSystemConfig(key, body.value, body.actorUserId),
    }
  }

  @Get('audit-logs')
  @UseGuards(AuthGuard)
  getAuditLogs() {
    return {
      success: true,
      data: this.adminService.listAuditLogs(),
    }
  }

  @Get('sync-jobs')
  @UseGuards(AuthGuard)
  getSyncJobs() {
    return {
      success: true,
      data: this.adminService.listSyncJobs(),
    }
  }

  // ─── Chat ───────────────────────────────────────────────────────────

  // ─── Agents ──────────────────────────────────────────────────────────

  @Get('agents')
  @UseGuards(AuthGuard)
  async listAgents(@Req() request: RequestWithHeaders) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: this.adminService.listAgents(payload.id),
    }
  }

  @Get('agents/:id')
  @UseGuards(AuthGuard)
  async getAgent(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: this.adminService.getAgent(id, payload.id),
    }
  }

  @Post('agents')
  @UseGuards(AuthGuard)
  async createAgent(
    @Req() request: RequestWithHeaders,
    @Body() body: Parameters<AdminService['createAgent']>[0],
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.createAgent(body, payload.id),
    }
  }

  @Patch('agents/:id')
  @UseGuards(AuthGuard)
  async updateAgent(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body() body: Parameters<AdminService['updateAgent']>[1],
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.updateAgent(id, body, payload.id),
    }
  }

  @Delete('agents/:id')
  @UseGuards(AuthGuard)
  async deleteAgent(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.deleteAgent(id, payload.id),
    }
  }

  @Post('agents/:id/duplicate')
  @UseGuards(AuthGuard)
  async duplicateAgent(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.duplicateAgent(id, payload.id),
    }
  }

  // ─── Agent chat ───────────────────────────────────────────────────────

  @Get('agents/:id/sessions')
  @UseGuards(AuthGuard)
  async listAgentSessions(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: this.adminService.listAgentSessions(id, payload.id),
    }
  }

  @Post('agents/:id/sessions')
  @UseGuards(AuthGuard)
  async createAgentSession(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body() body: { title?: string },
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    const result = await this.adminService.createAgentSession(id, body, payload.id)
    return { success: true, data: result }
  }

  @Get('agents/:id/sessions/:sessionId')
  @UseGuards(AuthGuard)
  async getAgentSession(
    @Req() request: RequestWithHeaders,
    @Param('sessionId') sessionId: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: this.adminService.getAgentSessionDetail(sessionId, payload.id),
    }
  }

  @Delete('agents/:id/sessions/:sessionId')
  @UseGuards(AuthGuard)
  async deleteAgentSession(
    @Req() request: RequestWithHeaders,
    @Param('sessionId') sessionId: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.deleteAgentSession(sessionId, payload.id),
    }
  }

  @Post('agents/:id/sessions/:sessionId/messages')
  @UseGuards(AuthGuard)
  async postAgentMessage(
    @Req() request: RequestWithHeaders,
    @Param('sessionId') sessionId: string,
    @Body() body: { content: string },
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    const result = await this.adminService.postAgentMessage(sessionId, body.content, payload.id)
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
    }
  }

  @Get('chat/profiles')
  @UseGuards(AuthGuard)
  getChatProfiles() {
    return {
      success: true,
      data: this.adminService.listModelProfiles(),
    }
  }

  @Get('chat/sessions')
  @UseGuards(AuthGuard)
  async listChatSessions(@Req() request: RequestWithHeaders) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: this.adminService.listChatSessions(payload.id),
    }
  }

  @Post('chat/sessions')
  @UseGuards(AuthGuard)
  async createChatSession(
    @Req() request: RequestWithHeaders,
    @Body() body: { title?: string; modelProfileId?: string },
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.createChatSession(body, payload.id),
    }
  }

  @Get('chat/sessions/:id')
  @UseGuards(AuthGuard)
  async getChatSession(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    const session = this.adminService.getChatSession(id, payload.id)
    return {
      success: true,
      data: {
        ...session,
        messages: this.adminService.listChatMessages(id, payload.id),
      },
    }
  }

  @Delete('chat/sessions/:id')
  @UseGuards(AuthGuard)
  async deleteChatSession(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    return {
      success: true,
      data: await this.adminService.deleteChatSession(id, payload.id),
    }
  }

  @Post('chat/sessions/:id/messages')
  @UseGuards(AuthGuard)
  async postChatMessage(
    @Req() request: RequestWithHeaders,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
    const payload = this.adminService.getCurrentUser(token)
    const result = await this.adminService.postChatMessage(id, body.content, payload.id)
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
    }
  }
}
