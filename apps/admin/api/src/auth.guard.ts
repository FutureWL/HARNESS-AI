import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { AdminService } from './admin.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly adminService: AdminService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>()
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少登录令牌')
    }

    const token = authHeader.replace('Bearer ', '')
    this.adminService.getCurrentUser(token)
    return true
  }
}
