import { OnModuleInit } from '@nestjs/common';
import type { AgentChatMessageRecord, AgentChatSessionRecord, AgentRecord, AuditLogRecord, ChatMessageRecord, ChatSessionRecord, DeviceRecord, ModelProfileRecord, SystemConfigRecord, SyncJobRecord, UserStatus } from './types';
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
    listModelProfiles(): ModelProfileRecord[];
    createModelProfile(input: {
        provider: string;
        apiBaseUrl: string;
        apiKey?: string;
        model: string;
        systemPrompt?: string;
        enabled?: boolean;
    }, actorUserId: string): Promise<ModelProfileRecord>;
    updateModelProfile(id: string, patch: {
        provider?: string;
        apiBaseUrl?: string;
        apiKey?: string | null;
        model?: string;
        systemPrompt?: string;
        enabled?: boolean;
    }, actorUserId: string): Promise<ModelProfileRecord>;
    deleteModelProfile(id: string, actorUserId: string): Promise<{
        id: string;
    }>;
    listSystemConfigs(): SystemConfigRecord[];
    updateSystemConfig(configKey: string, configValue: string | boolean | number, actorUserId: string): Promise<SystemConfigRecord>;
    listAuditLogs(): AuditLogRecord[];
    listSyncJobs(): SyncJobRecord[];
    listChatSessions(userId: string): ChatSessionRecord[];
    getChatSession(sessionId: string, userId: string): ChatSessionRecord;
    createChatSession(input: {
        title?: string;
        modelProfileId?: string;
    }, actorUserId: string): Promise<ChatSessionRecord>;
    deleteChatSession(sessionId: string, actorUserId: string): Promise<{
        id: string;
    }>;
    listChatMessages(sessionId: string, actorUserId: string): ChatMessageRecord[];
    postChatMessage(sessionId: string, content: string, actorUserId: string): Promise<{
        userMessage: ChatMessageRecord;
        assistantMessage: ChatMessageRecord;
        model: ModelProfileRecord | null;
        mocked: boolean;
    }>;
    listAgents(actorUserId: string): AgentRecord[];
    getAgent(agentId: string, actorUserId: string): AgentRecord;
    createAgent(input: {
        name: string;
        avatar?: string;
        description?: string;
        systemPrompt: string;
        welcomeMessage?: string;
        modelProfileId?: string;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        status?: 'active' | 'disabled';
    }, actorUserId: string): Promise<AgentRecord>;
    updateAgent(agentId: string, patch: Partial<{
        name: string;
        avatar: string;
        description: string;
        systemPrompt: string;
        welcomeMessage: string;
        modelProfileId: string | null;
        temperature: number;
        maxTokens: number;
        topP: number;
        status: 'active' | 'disabled';
    }>, actorUserId: string): Promise<AgentRecord>;
    deleteAgent(agentId: string, actorUserId: string): Promise<{
        id: string;
    }>;
    duplicateAgent(agentId: string, actorUserId: string): Promise<AgentRecord>;
    listAgentSessions(agentId: string, actorUserId: string): AgentChatSessionRecord[];
    createAgentSession(agentId: string, input: {
        title?: string;
    }, actorUserId: string): Promise<{
        session: AgentChatSessionRecord;
        agent: AgentRecord;
        welcomeMessage: string;
    }>;
    getAgentSessionDetail(sessionId: string, actorUserId: string): {
        session: AgentChatSessionRecord;
        agent: AgentRecord;
        messages: AgentChatMessageRecord[];
    };
    deleteAgentSession(sessionId: string, actorUserId: string): Promise<{
        id: string;
    }>;
    postAgentMessage(sessionId: string, content: string, actorUserId: string): Promise<{
        userMessage: AgentChatMessageRecord;
        assistantMessage: AgentChatMessageRecord;
        agent: AgentRecord;
        model: ModelProfileRecord | null;
        mocked: boolean;
    }>;
    private requireUser;
    private requireAgent;
    private clampNumber;
    private callModelForAgent;
    private agentMockReply;
    private callModel;
    private mockReply;
    private load;
    private mergeSeed;
    private persist;
    private hashPassword;
    private signToken;
    private verifyToken;
    private appendAuditLog;
    private toSafeUser;
    private createSeedData;
}
