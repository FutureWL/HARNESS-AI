import { OnModuleInit } from '@nestjs/common';
import type { AuditLogRecord, DeviceRecord, SystemConfigRecord, SyncJobRecord, UserStatus } from './types';
export declare class AdminService implements OnModuleInit {
    private data;
    private readonly storageDir;
    private readonly storageFile;
    private readonly tokenSecret;
    onModuleInit(): Promise<void>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        profile: {
            id: string;
            organizationId: string;
            email: string;
            name: string;
            role: "super-admin" | "org-admin" | "ops" | "end-user";
            status: UserStatus;
            lastLoginAt: string | undefined;
            createdAt: string;
        };
        credentials: {
            email: string;
            passwordHint: string;
        };
    }>;
    getCurrentUser(token: string): {
        id: string;
        organizationId: string;
        email: string;
        name: string;
        role: "super-admin" | "org-admin" | "ops" | "end-user";
        status: UserStatus;
        lastLoginAt: string | undefined;
        createdAt: string;
    };
    getDashboardOverview(): {
        metrics: {
            label: string;
            value: number;
            delta: string;
        }[];
        alerts: string[];
    };
    listOrganizations(): import("./types").OrganizationRecord[];
    listUsers(): {
        id: string;
        organizationId: string;
        email: string;
        name: string;
        role: "super-admin" | "org-admin" | "ops" | "end-user";
        status: UserStatus;
        lastLoginAt: string | undefined;
        createdAt: string;
    }[];
    createUser(input: {
        organizationId: string;
        email: string;
        name: string;
        role: 'super-admin' | 'org-admin' | 'ops' | 'end-user';
        password: string;
    }, actorUserId: string): Promise<{
        id: string;
        organizationId: string;
        email: string;
        name: string;
        role: "super-admin" | "org-admin" | "ops" | "end-user";
        status: UserStatus;
        lastLoginAt: string | undefined;
        createdAt: string;
    }>;
    updateUserStatus(userId: string, status: UserStatus, actorUserId: string): Promise<{
        id: string;
        organizationId: string;
        email: string;
        name: string;
        role: "super-admin" | "org-admin" | "ops" | "end-user";
        status: UserStatus;
        lastLoginAt: string | undefined;
        createdAt: string;
    }>;
    listDevices(): DeviceRecord[];
    registerDevice(input: Pick<DeviceRecord, 'organizationId' | 'userId' | 'platform' | 'appVersion'>): Promise<DeviceRecord>;
    heartbeat(deviceId: string): Promise<DeviceRecord>;
    listLicenses(): import("./types").LicenseRecord[];
    listModelProfiles(): import("./types").ModelProfileRecord[];
    listSystemConfigs(): SystemConfigRecord[];
    updateSystemConfig(configKey: string, configValue: string | boolean | number, actorUserId: string): Promise<SystemConfigRecord>;
    listAuditLogs(): AuditLogRecord[];
    listSyncJobs(): SyncJobRecord[];
    private load;
    private persist;
    private hashPassword;
    private signToken;
    private verifyToken;
    private appendAuditLog;
    private toSafeUser;
    private createSeedData;
}
