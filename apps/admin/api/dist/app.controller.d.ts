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
    createModelProfile(request: RequestWithHeaders, body: {
        provider: string;
        apiBaseUrl: string;
        apiKey?: string;
        model: string;
        systemPrompt?: string;
        enabled?: boolean;
    }): Promise<{
        success: boolean;
        data: import("./types").ModelProfileRecord;
    }>;
    updateModelProfile(request: RequestWithHeaders, id: string, body: {
        provider?: string;
        apiBaseUrl?: string;
        apiKey?: string | null;
        model?: string;
        systemPrompt?: string;
        enabled?: boolean;
    }): Promise<{
        success: boolean;
        data: import("./types").ModelProfileRecord;
    }>;
    deleteModelProfile(request: RequestWithHeaders, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
        };
    }>;
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
    listAgents(request: RequestWithHeaders): Promise<{
        success: boolean;
        data: import("./types").AgentRecord[];
    }>;
    getAgent(request: RequestWithHeaders, id: string): Promise<{
        success: boolean;
        data: import("./types").AgentRecord;
    }>;
    createAgent(request: RequestWithHeaders, body: Parameters<AdminService['createAgent']>[0]): Promise<{
        success: boolean;
        data: import("./types").AgentRecord;
    }>;
    updateAgent(request: RequestWithHeaders, id: string, body: Parameters<AdminService['updateAgent']>[1]): Promise<{
        success: boolean;
        data: import("./types").AgentRecord;
    }>;
    deleteAgent(request: RequestWithHeaders, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
        };
    }>;
    duplicateAgent(request: RequestWithHeaders, id: string): Promise<{
        success: boolean;
        data: import("./types").AgentRecord;
    }>;
    listAgentSessions(request: RequestWithHeaders, id: string): Promise<{
        success: boolean;
        data: import("./types").AgentChatSessionRecord[];
    }>;
    createAgentSession(request: RequestWithHeaders, id: string, body: {
        title?: string;
    }): Promise<{
        success: boolean;
        data: {
            session: import("./types").AgentChatSessionRecord;
            agent: import("./types").AgentRecord;
            welcomeMessage: string;
        };
    }>;
    getAgentSession(request: RequestWithHeaders, sessionId: string): Promise<{
        success: boolean;
        data: {
            session: import("./types").AgentChatSessionRecord;
            agent: import("./types").AgentRecord;
            messages: import("./types").AgentChatMessageRecord[];
        };
    }>;
    deleteAgentSession(request: RequestWithHeaders, sessionId: string): Promise<{
        success: boolean;
        data: {
            id: string;
        };
    }>;
    postAgentMessage(request: RequestWithHeaders, sessionId: string, body: {
        content: string;
    }): Promise<{
        success: boolean;
        data: {
            userMessage: import("./types").AgentChatMessageRecord;
            assistantMessage: import("./types").AgentChatMessageRecord;
            agent: import("./types").AgentRecord;
            model: {
                id: string;
                provider: string;
                model: string;
                apiBaseUrl: string;
            } | null;
            mocked: boolean;
        };
    }>;
    getChatProfiles(): {
        success: boolean;
        data: import("./types").ModelProfileRecord[];
    };
    listChatSessions(request: RequestWithHeaders): Promise<{
        success: boolean;
        data: import("./types").ChatSessionRecord[];
    }>;
    createChatSession(request: RequestWithHeaders, body: {
        title?: string;
        modelProfileId?: string;
    }): Promise<{
        success: boolean;
        data: import("./types").ChatSessionRecord;
    }>;
    getChatSession(request: RequestWithHeaders, id: string): Promise<{
        success: boolean;
        data: {
            messages: import("./types").ChatMessageRecord[];
            id: string;
            userId: string;
            organizationId: string;
            title: string;
            modelProfileId?: string;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    deleteChatSession(request: RequestWithHeaders, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
        };
    }>;
    postChatMessage(request: RequestWithHeaders, id: string, body: {
        content: string;
    }): Promise<{
        success: boolean;
        data: {
            session: import("./types").ChatSessionRecord;
            userMessage: import("./types").ChatMessageRecord;
            assistantMessage: import("./types").ChatMessageRecord;
            model: {
                id: string;
                provider: string;
                model: string;
                apiBaseUrl: string;
            } | null;
            mocked: boolean;
        };
    }>;
}
export {};
