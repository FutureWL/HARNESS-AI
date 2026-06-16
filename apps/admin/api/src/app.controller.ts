import {
  Body,
  Controller,
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
}
