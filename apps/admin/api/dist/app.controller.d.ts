import { AdminService } from './admin.service';
type RequestWithHeaders = {
    headers: Record<string, string | undefined>;
};
export declare class AppController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getHealth(): {
        success: boolean;
        data: {
            service: string;
            status: string;
        };
    };
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        data: {
            accessToken: string;
            profile: {
                id: string;
                organizationId: string;
                email: string;
                name: string;
                role: "super-admin" | "org-admin" | "ops" | "end-user";
                status: import("./types").UserStatus;
                lastLoginAt: string | undefined;
                createdAt: string;
            };
            credentials: {
                email: string;
                passwordHint: string;
            };
        };
    }>;
    getMe(request: RequestWithHeaders): {
        success: boolean;
        data: {
            id: string;
            organizationId: string;
            email: string;
            name: string;
            role: "super-admin" | "org-admin" | "ops" | "end-user";
            status: import("./types").UserStatus;
            lastLoginAt: string | undefined;
            createdAt: string;
        };
    };
    getDashboardOverview(): {
        success: boolean;
        data: {
            metrics: {
                label: string;
                value: number;
                delta: string;
            }[];
            alerts: string[];
        };
    };
    getOrganizations(): {
        success: boolean;
        data: import("./types").OrganizationRecord[];
    };
    getUsers(): {
        success: boolean;
        data: {
            id: string;
            organizationId: string;
            email: string;
            name: string;
            role: "super-admin" | "org-admin" | "ops" | "end-user";
            status: import("./types").UserStatus;
            lastLoginAt: string | undefined;
            createdAt: string;
        }[];
    };
    createUser(body: {
        organizationId: string;
        email: string;
        name: string;
        role: 'super-admin' | 'org-admin' | 'ops' | 'end-user';
        password: string;
        actorUserId: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            organizationId: string;
            email: string;
            name: string;
            role: "super-admin" | "org-admin" | "ops" | "end-user";
            status: import("./types").UserStatus;
            lastLoginAt: string | undefined;
            createdAt: string;
        };
    }>;
    updateUserStatus(id: string, body: {
        status: 'active' | 'disabled';
        actorUserId: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            organizationId: string;
            email: string;
            name: string;
            role: "super-admin" | "org-admin" | "ops" | "end-user";
            status: import("./types").UserStatus;
            lastLoginAt: string | undefined;
            createdAt: string;
        };
    }>;
    getDevices(): {
        success: boolean;
        data: import("./types").DeviceRecord[];
    };
    registerDevice(body: {
        organizationId: string;
        userId?: string;
        platform: 'windows' | 'macos' | 'linux';
        appVersion: string;
    }): Promise<{
        success: boolean;
        data: import("./types").DeviceRecord;
    }>;
    heartbeat(body: {
        deviceId: string;
    }): Promise<{
        success: boolean;
        data: import("./types").DeviceRecord;
    }>;
    getLicenses(): {
        success: boolean;
        data: import("./types").LicenseRecord[];
    };
    getModelProfiles(): {
        success: boolean;
        data: import("./types").ModelProfileRecord[];
    };
    getSystemConfigs(): {
        success: boolean;
        data: import("./types").SystemConfigRecord[];
    };
    updateSystemConfig(key: string, body: {
        value: string | boolean | number;
        actorUserId: string;
    }): Promise<{
        success: boolean;
        data: import("./types").SystemConfigRecord;
    }>;
    getAuditLogs(): {
        success: boolean;
        data: import("./types").AuditLogRecord[];
    };
    getSyncJobs(): {
        success: boolean;
        data: import("./types").SyncJobRecord[];
    };
}
export {};
