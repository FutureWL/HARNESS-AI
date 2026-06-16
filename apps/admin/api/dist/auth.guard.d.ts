import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AdminService } from './admin.service';
export declare class AuthGuard implements CanActivate {
    private readonly adminService;
    constructor(adminService: AdminService);
    canActivate(context: ExecutionContext): boolean;
}
