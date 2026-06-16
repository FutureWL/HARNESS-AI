import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Database,
  FileSearch,
  FolderOpen,
  Library,
  LoaderCircle,
  RefreshCcw,
  Search,
  Settings2,
  Sparkles,
  UserRound,
} from "lucide-react";

type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type SettingsRecord = {
  model: string;
  apiKey: string;
  baseUrl: string;
  adminApiBaseUrl?: string;
  adminAccessToken?: string;
  adminUserEmail?: string;
};

type IpcReply<T> = {
  success: boolean;
  data?: T;
  error?: string;
  traceId?: string;
};

type HarnessApi = {
  pickImportTargets: () => Promise<IpcReply<string[]>>;
  importFiles: (paths: string[]) => Promise<IpcReply<DocumentRecord[]>>;
  listDocuments: (query?: string) => Promise<IpcReply<DocumentRecord[]>>;
  getSettings: () => Promise<IpcReply<SettingsRecord>>;
  updateSettings?: (payload: Record<string, string>) => Promise<IpcReply<SettingsRecord>>;
};

const mockDocuments: DocumentRecord[] = [
  {
    id: "demo-readme",
    title: "项目 README",
    content: "整理项目目标、模块拆分、运行方式与桌面端整体结构说明。",
    tags: ["项目", "说明"],
    createdAt: "2026-06-01T09:30:00.000Z",
    updatedAt: "2026-06-09T10:25:00.000Z",
  },
  {
    id: "demo-rag",
    title: "RAG 设计草稿",
    content: "记录知识导入、SQLite FTS 检索、问答上下文拼装与模型调用流程。",
    tags: ["RAG", "检索"],
    createdAt: "2026-06-03T08:10:00.000Z",
    updatedAt: "2026-06-08T14:42:00.000Z",
  },
  {
    id: "demo-release",
    title: "Linux 打包记录",
    content: "包含 AppImage 打包、目录版构建、证书与发布说明等内容。",
    tags: ["发布", "Linux"],
    createdAt: "2026-06-05T11:00:00.000Z",
    updatedAt: "2026-06-09T07:15:00.000Z",
  },
];

const mockSettings: SettingsRecord = {
  model: "gpt-4o-mini",
  apiKey: "",
  baseUrl: "https://api.openai.com",
  adminApiBaseUrl: "http://localhost:3201",
};

const quickActions = [
  {
    title: "导入知识文件",
    description: "从本地选择 Markdown、TXT 或 PDF，建立知识库索引。",
    icon: FolderOpen,
    tone: "from-emerald-400/20 to-emerald-300/5",
  },
  {
    title: "搜索历史文档",
    description: "对已导入内容做快速定位，查看最近更新与标签分布。",
    icon: FileSearch,
    tone: "from-sky-400/20 to-sky-300/5",
  },
  {
    title: "准备问答能力",
    description: "配置模型与 API Key 后，桌面端即可开始检索式问答。",
    icon: Bot,
    tone: "from-violet-400/20 to-violet-300/5",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function excerpt(content: string) {
  return content.replace(/\s+/g, " ").slice(0, 78) || "暂无内容摘要";
}

function getHarnessApi() {
  return (window as Window & { harness?: HarnessApi }).harness;
}

export default function Home() {
  const harness = getHarnessApi();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<SettingsRecord>(mockSettings);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adminEmail, setAdminEmail] = useState("user1@harness.local");
  const [adminPassword, setAdminPassword] = useState("user123456");
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");
  const adminConfigured = Boolean(settings.adminAccessToken);

  async function loadHome() {
    setLoading(true);
    setError("");

    if (!harness) {
      setDocuments(mockDocuments);
      setSettings(mockSettings);
      setNotice("当前为浏览器预览模式，展示的是示例数据。");
      setLoading(false);
      return;
    }

    try {
      const [docsReply, settingsReply] = await Promise.all([
        harness.listDocuments(),
        harness.getSettings(),
      ]);

      if (!docsReply.success) throw new Error(docsReply.error || "读取文档失败");
      if (!settingsReply.success) throw new Error(settingsReply.error || "读取设置失败");

      setDocuments(docsReply.data || []);
      setSettings(settingsReply.data || mockSettings);
      setNotice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载首页失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!harness) {
      setNotice("当前预览环境无法打开系统文件选择器，请在 Electron 客户端中体验导入。");
      return;
    }

    setImporting(true);
    setError("");

    try {
      const picked = await harness.pickImportTargets();
      if (!picked.success) throw new Error(picked.error || "选择文件失败");
      if (!picked.data?.length) return;

      const imported = await harness.importFiles(picked.data);
      if (!imported.success) throw new Error(imported.error || "导入文件失败");

      setNotice(`已完成导入，本次新增 ${imported.data?.length || 0} 个文档。`);
      await loadHome();
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setImporting(false);
    }
  }

  async function handleAdminLogin() {
    setAdminLoggingIn(true);
    setAdminLoginError("");

    try {
      const baseUrl = (settings.adminApiBaseUrl || "http://localhost:3201").replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        data?: { accessToken: string; profile: { email: string } };
        message?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "登录后台失败");
      }

      const nextSettings: SettingsRecord = {
        ...settings,
        adminAccessToken: payload.data.accessToken,
        adminUserEmail: payload.data.profile.email,
      };

      if (harness?.updateSettings) {
        const reply = await harness.updateSettings({
          adminAccessToken: payload.data.accessToken,
          adminUserEmail: payload.data.profile.email,
          adminApiBaseUrl: baseUrl,
        });
        if (reply.success && reply.data) {
          setSettings(reply.data);
        } else {
          setSettings(nextSettings);
        }
      } else {
        setSettings(nextSettings);
      }

      setNotice("已登录后台，可用于后续设备绑定与配置下发测试。");
    } catch (err) {
      setAdminLoginError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setAdminLoggingIn(false);
    }
  }

  useEffect(() => {
    void loadHome();
  }, []);

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return documents;

    return documents.filter((doc) => {
      const haystack = `${doc.title} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [documents, search]);

  const latestDocuments = filteredDocuments.slice(0, 5);
  const configured = Boolean(settings.apiKey);
  const totalChars = documents.reduce((sum, doc) => sum + doc.content.length, 0);
  const totalTags = new Set(documents.flatMap((doc) => doc.tags)).size;
  const stats = [
    {
      label: "知识文档",
      value: String(documents.length).padStart(2, "0"),
      hint: "已导入到本地数据库",
      icon: Library,
    },
    {
      label: "内容字符",
      value: totalChars > 0 ? `${Math.round(totalChars / 1000)}k` : "0",
      hint: "用于检索和问答上下文",
      icon: Database,
    },
    {
      label: "标签数量",
      value: String(totalTags).padStart(2, "0"),
      hint: "便于后续整理与筛选",
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-slate-950/90 px-5 py-6 lg:min-h-screen lg:w-[280px] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/20">
              <Sparkles className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Harness AI</div>
              <div className="text-lg font-semibold tracking-wide">桌面知识工作台</div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">当前状态</div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900/80 px-4 py-3">
              <div>
                <div className="text-sm text-slate-300">模型配置</div>
                <div className="mt-1 text-xs text-slate-500">
                  {configured ? settings.model || "已配置模型" : "尚未设置 API Key"}
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  configured
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-amber-400/15 text-amber-200"
                }`}
              >
                {configured ? "已就绪" : "待配置"}
              </span>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-900/60 px-4 py-3">
              <div className="text-sm text-slate-300">知识库引擎</div>
              <div className="mt-1 text-xs text-slate-500">SQLite + FTS 检索，本地优先存储</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="px-2 text-xs uppercase tracking-[0.2em] text-slate-500">首页导航</div>
            <div className="mt-3 space-y-2">
              {[
                { label: "工作台总览", active: true, icon: Library },
                { label: "导入与整理", active: false, icon: FolderOpen },
                { label: "搜索与问答", active: false, icon: Search },
                { label: "模型设置", active: false, icon: Settings2 },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${
                    item.active
                      ? "bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-400/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-7">
          <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  本地优先的知识管理桌面端
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                  从导入文档开始，把首页变成你的知识工作台入口
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 lg:text-base">
                  现在你可以在这里查看知识库规模、快速导入本地资料、检查模型配置是否可用，
                  后续的搜索、问答和文档详情页都可以从这个首页继续扩展。
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleImport()}
                    disabled={importing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importing ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <FolderOpen className="h-4 w-4" />
                    )}
                    {importing ? "正在导入..." : "导入知识文件"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadHome()}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    刷新首页数据
                  </button>
                </div>
              </div>

              <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </span>
                      <item.icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="mt-5 text-3xl font-semibold text-white">{item.value}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-400">{item.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">最近文档</div>
                  <div className="mt-1 text-sm text-slate-400">
                    首页先展示最近的知识内容，后续可以接文档详情和编辑页。
                  </div>
                </div>
                <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 lg:w-[320px]">
                  <Search className="h-4 w-4" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜索标题、正文或标签"
                    className="w-full bg-transparent outline-none placeholder:text-slate-600"
                  />
                </label>
              </div>

              {loading ? (
                <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-slate-400">
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  正在加载首页数据
                </div>
              ) : latestDocuments.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {latestDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/20 hover:bg-white/[0.05]"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-emerald-400/10 p-2 text-emerald-200">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div className="truncate text-base font-medium text-white">
                              {doc.title}
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-400">
                            {excerpt(doc.content)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(doc.tags.length ? doc.tags : ["未标记"]).map((tag) => (
                              <span
                                key={`${doc.id}-${tag}`}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-slate-500">
                          更新于 {formatDate(doc.updatedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 text-slate-300">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-lg font-medium text-white">知识库还是空的</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">
                    先导入你的 Markdown、TXT 或 PDF，首页就会出现最近文档和统计信息。
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleImport()}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-300/15"
                  >
                    立即导入
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-400/10 p-2 text-sky-300">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">模型接入状态</div>
                    <div className="text-sm text-slate-400">问答功能的前置检查</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">Base URL</div>
                    <div className="mt-1 break-all text-slate-200">
                      {settings.baseUrl || "未设置，默认将使用 OpenAI 官方地址"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">Model</div>
                    <div className="mt-1 text-slate-200">
                      {settings.model || "未设置，默认将回退到 gpt-4o-mini"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">API Key</div>
                    <div className="mt-1 text-slate-200">
                      {configured ? "已配置，可继续接问答页面" : "未配置，当前无法请求模型"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-400/10 p-2 text-emerald-300">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">后台登录（测试）</div>
                    <div className="text-sm text-slate-400">用于验证桌面端与后台账号体系连通</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">后台地址</div>
                    <div className="mt-1 break-all text-slate-200">
                      {settings.adminApiBaseUrl || "http://localhost:3201"}
                    </div>
                  </div>
                  <label className="block rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">邮箱</div>
                    <input
                      value={adminEmail}
                      onChange={(event) => setAdminEmail(event.target.value)}
                      className="mt-2 w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-600"
                      placeholder="user@harness.local"
                    />
                  </label>
                  <label className="block rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">密码</div>
                    <input
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                      type="password"
                      className="mt-2 w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-600"
                      placeholder="请输入密码"
                    />
                  </label>

                  {adminLoginError ? (
                    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                      {adminLoginError}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        adminConfigured
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {adminConfigured ? `已登录：${settings.adminUserEmail || ""}` : "未登录"}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleAdminLogin()}
                      disabled={adminLoggingIn}
                      className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adminLoggingIn ? "登录中..." : "登录后台"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
                <div className="text-lg font-semibold text-white">接下来可继续做</div>
                <div className="mt-4 space-y-3">
                  {quickActions.map((item) => (
                    <div
                      key={item.title}
                      className={`rounded-3xl border border-white/10 bg-gradient-to-br ${item.tone} p-4`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-black/20 p-2">
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{item.title}</div>
                          <div className="mt-1 text-sm leading-6 text-slate-300">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(notice || error) && (
                <div
                  className={`rounded-[28px] border p-4 text-sm leading-6 ${
                    error
                      ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                      : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  }`}
                >
                  {error || notice}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
