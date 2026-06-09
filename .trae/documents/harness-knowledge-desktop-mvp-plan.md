# Harness 个人知识显化桌面应用规划

## Summary

- 项目目标：构建一个面向知识工作者的个人知识 harness 桌面应用，帮助用户把过往知识、经验、方法论和资料沉淀为可检索、可问答、可复用的个人能力资产。
- 第一版定位：个人版、本地优先、桌面端、单机使用；优先解决“知识沉淀检索”问题，以“搜索 + 问答”为核心交互入口。
- 第一阶段交付：产出可执行的产品方案与技术方案，并据此搭建一个可逐步实现的 MVP 工程骨架。
- 核心能力：本地文件导入、文本提取与切片、索引构建、搜索检索、基于检索增强的 AI 问答、知识条目浏览与基础整理。
- 明确不做：多人协作、团队权限、复杂知识图谱、高级自动工作流。

## Current State Analysis

- 当前工作目录 [HARNESS-AI](file:///d:/CodeProjects/AI_PJ/HARNESS-AI) 基本为空。
- 当前目录不是 Git 仓库，尚未看到任何现有代码、配置、脚手架或文档。
- 当前也不存在 [.trae](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/.trae) 或现成计划文档，说明本次需要按“从 0 到 1 的新项目初始化”来规划。
- 因为没有既有实现，本次计划会直接定义产品边界、工程结构、技术路线、核心模块、接口草案和验证步骤。

## Assumptions & Decisions

- 目标用户：需要内化和显化个人知识与技能的知识工作者。
- MVP 核心场景：导入本地知识资料后，用户可以通过搜索和问答快速找回自己过去的内容，并得到基于个人知识库的回答。
- 产品形态：桌面应用，技术路线采用 Electron + Web 前端。
- 数据策略：本地优先。知识原文、索引、元数据均保存在本地，AI 能力通过可配置远程模型 API 接入。
- 首批知识来源：本地文件，优先支持 Markdown、TXT、PDF；DOCX 作为次优先支持项。
- 首版范围：单用户、本机使用、不做登录系统、不做云同步、不做多人协作。
- 主交互：全局搜索框 + AI 问答面板 + 知识库列表/详情页。
- 回答策略：采用 RAG（检索增强生成），要求回答附带引用片段与来源文件，避免“凭空生成”。
- 技术栈建议：
  - 桌面层：Electron
  - 前端：React + TypeScript + Vite
  - UI：Tailwind CSS + shadcn/ui
  - 本地数据库：SQLite
  - 后端/本地服务层：Node.js + TypeScript
  - 文本搜索：SQLite FTS5
  - 向量检索：初期可使用 sqlite-vec 或本地向量表方案；如实现复杂度过高，则第一期先落关键词检索 + 摘要问答，第二期加入向量召回
  - AI 接入：OpenAI 兼容 API 抽象层，支持后续扩展更多供应商
- 语言假设：产品首版界面优先中文。

## Proposed Changes

### 1. 初始化工程与仓库基础

- 拟创建 [package.json](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/package.json)
  - 作用：统一管理 monorepo/workspace 脚本、依赖和开发命令。
  - 做法：采用 workspace 结构，统一 `dev`、`build`、`lint`、`test`、`electron:dev` 等脚本。
- 拟创建 [pnpm-workspace.yaml](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/pnpm-workspace.yaml)
  - 作用：管理多包工程。
- 拟创建 [.gitignore](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/.gitignore)
  - 作用：忽略构建产物、数据库、索引、日志、环境变量与 Electron 打包输出。
- 拟创建 [README.md](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/README.md)
  - 作用：描述产品定位、开发启动方式、目录结构与里程碑。
- 拟创建 [.env.example](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/.env.example)
  - 作用：声明 AI API Base URL、API Key、默认模型名等可配置项。

### 2. 建立 Electron + Web 前端双层结构

- 拟创建 [apps/desktop](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/desktop)
  - 作用：存放 Electron 主进程、preload、窗口生命周期与本地 IPC 注册。
  - 关键文件：
    - [apps/desktop/src/main.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/desktop/src/main.ts)：应用入口，创建窗口、注册协议、初始化本地数据目录。
    - [apps/desktop/src/preload.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/desktop/src/preload.ts)：暴露安全的 renderer API。
    - [apps/desktop/src/ipc/index.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/desktop/src/ipc/index.ts)：集中注册所有 IPC handler。
- 拟创建 [apps/renderer](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer)
  - 作用：存放 React 前端界面。
  - 关键文件：
    - [apps/renderer/src/main.tsx](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer/src/main.tsx)：前端入口。
    - [apps/renderer/src/App.tsx](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer/src/App.tsx)：应用壳层与路由装配。
    - [apps/renderer/src/routes](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer/src/routes)：页面路由。
    - [apps/renderer/src/components](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer/src/components)：复用组件。
    - [apps/renderer/src/features/search](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer/src/features/search)：搜索与问答 UI。
    - [apps/renderer/src/features/library](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer/src/features/library)：知识库列表与详情。
    - [apps/renderer/src/features/import](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer/src/features/import)：导入与索引构建流程。

### 3. 建立共享领域层与本地服务层

- 拟创建 [packages/shared](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/shared)
  - 作用：沉淀类型定义、DTO、领域模型、常量与校验器。
  - 关键文件：
    - [packages/shared/src/types/document.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/shared/src/types/document.ts)
    - [packages/shared/src/types/search.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/shared/src/types/search.ts)
    - [packages/shared/src/types/chat.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/shared/src/types/chat.ts)
- 拟创建 [packages/core](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core)
  - 作用：承载不依赖 UI 的核心业务能力。
  - 核心模块：
    - [packages/core/src/ingest](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core/src/ingest)：文件扫描、类型识别、解析与文本抽取。
    - [packages/core/src/chunking](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core/src/chunking)：文档切片、段落边界、元数据挂载。
    - [packages/core/src/indexing](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core/src/indexing)：写入搜索索引与向量索引。
    - [packages/core/src/search](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core/src/search)：关键词检索、混合召回、结果重排。
    - [packages/core/src/chat](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core/src/chat)：RAG 上下文构建、提示词编排、引用拼装。
    - [packages/core/src/ai](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core/src/ai)：模型适配层。
    - [packages/core/src/storage](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core/src/storage)：SQLite 访问与 Repository。

### 4. 设计本地数据模型

- 拟创建 [packages/core/src/storage/schema.sql](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core/src/storage/schema.sql)
  - 作用：定义 SQLite 表结构。
  - 建议表：
    - `documents`：文档主表，记录文件路径、hash、标题、来源、导入状态、创建/更新时间。
    - `document_chunks`：切片表，记录 chunk 文本、顺序、token 估算、所属文档。
    - `tags` 与 `document_tags`：基础标签能力。
    - `chat_sessions`：问答会话。
    - `chat_messages`：消息记录。
    - `settings`：本地应用配置。
  - 搜索策略：
    - 使用 FTS5 为 `documents`/`document_chunks` 建全文索引。
    - 预留 embedding 字段或独立向量表，为后续向量召回做准备。

### 5. 定义核心业务流程

- 导入流程
  - 用户选择文件/文件夹。
  - 应用扫描文件并识别支持格式。
  - 解析器抽取纯文本与基础元数据。
  - 对文本做切片。
  - 生成索引并写入 SQLite。
  - 返回导入结果、失败原因与重试建议。
- 搜索流程
  - 用户输入关键词。
  - 先执行 FTS5 召回。
  - 可选执行 embedding 召回。
  - 聚合去重后展示片段、来源、命中位置。
- 问答流程
  - 用户发起问题。
  - 系统先检索相关 chunks。
  - 构建提示词，约束模型“仅依据提供资料回答”。
  - 返回答案 + 引用来源 + 置信提示。
- 整理流程
  - 用户可查看文档详情、编辑标题、补充标签、标记收藏。
  - 第一版不做复杂图谱，只保留轻量结构化能力。

### 6. 设计 IPC / 应用接口

- 拟在 [apps/desktop/src/ipc/index.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/desktop/src/ipc/index.ts) 注册以下接口：
  - `library.importFiles(paths: string[])`
  - `library.listDocuments(query)`
  - `library.getDocument(documentId: string)`
  - `library.updateDocumentMeta(payload)`
  - `search.query(payload)`
  - `chat.ask(payload)`
  - `settings.get()`
  - `settings.update(payload)`
- 前端通过 preload 暴露的安全 API 调用，避免直接开启危险 Node 能力。
- 所有接口统一返回结构：
  - `success`
  - `data`
  - `error`
  - `traceId`

### 7. 设计首版前端信息架构

- 首页 / 搜索页
  - 顶部全局搜索框
  - 左侧知识库导航
  - 中间搜索结果列表
  - 右侧问答面板或来源预览
- 知识库页
  - 文档列表
  - 标签/来源筛选
  - 导入按钮
  - 导入状态反馈
- 文档详情页
  - 原始内容摘要
  - 切片预览
  - 来源路径
  - 标签和备注
- 设置页
  - API Base URL
  - API Key
  - 模型名称
  - 本地数据目录

### 8. 关键实现策略与边界处理

- 文件去重：基于路径 + hash 判断重复导入。
- 大文件处理：限制单次解析大小；超限文件进入“部分导入/失败列表”。
- 解析失败：记录失败原因并允许重试。
- 幻觉控制：回答必须附引用，若证据不足则直接告知“知识库中未找到充分依据”。
- 隐私保护：API 调用前提供显式设置与说明；后续可扩展“敏感文件不出本地”的策略。
- 性能控制：导入、切片、索引构建采用后台任务队列，避免阻塞 UI。
- 可扩展性：在 `ai`、`ingest`、`search` 模块做接口抽象，方便后续接更多解析器和模型。

### 9. 测试与验收设计

- 拟创建 [packages/core/src/**/*.test.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/packages/core)
  - 覆盖文档切片、搜索召回、提示词上下文拼装等核心纯逻辑。
- 拟创建 [apps/desktop/src/ipc/**/*.test.ts](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/desktop/src/ipc)
  - 覆盖 IPC handler 的输入输出与错误包装。
- 拟创建 [apps/renderer/src/features/**/*.test.tsx](file:///d:/CodeProjects/AI_PJ/HARNESS-AI/apps/renderer/src/features)
  - 覆盖搜索页、导入状态、问答展示等关键交互。
- 手工验收标准：
  - 能导入至少 20 个本地文档。
  - 搜索关键词时能返回相关文档与片段。
  - 针对已导入知识提问时，回答含来源引用。
  - 设置远程模型参数后可正常发起问答。
  - 关闭并重新打开应用后，本地知识库与会话仍保留。

## Recommended Milestones

### Milestone 1：项目骨架与基础设施

- 初始化 workspace、Electron、React、TypeScript、Tailwind、UI 组件体系。
- 建立基础目录、共享类型、IPC 通道、设置页与本地配置管理。

### Milestone 2：本地知识导入与索引

- 完成本地文件选择、文本解析、切片、SQLite 落库、FTS 搜索。
- 打通知识库列表和详情页。

### Milestone 3：RAG 问答闭环

- 接入远程模型配置。
- 实现检索上下文拼装、问答输出与引用展示。

### Milestone 4：体验增强

- 增加标签、收藏、导入失败重试、结果高亮、搜索筛选。
- 评估是否接入向量召回提升结果质量。

## Verification Steps

- 环境验证
  - 安装依赖并确保 Electron 与前端开发模式都能启动。
- 导入验证
  - 使用示例 Markdown、TXT、PDF 文件执行导入，检查数据库和检索结果。
- 搜索验证
  - 输入来自文档正文的关键字，确认结果相关性与引用准确性。
- 问答验证
  - 用知识库已有内容提问，确认回答仅基于引用资料。
- 持久化验证
  - 重启应用后确认文档索引、设置与历史问答存在。
- 健壮性验证
  - 导入空文件、重复文件、超大文件和损坏文件，确认错误处理符合预期。

## Execution Notes

- 执行阶段建议优先完成最小闭环：`导入 -> 索引 -> 搜索 -> 问答 -> 引用展示`。
- 如果首轮实现复杂度过高，优先保证 FTS5 关键词召回可用，把向量召回延后到第二阶段。
- 若要进一步降低 MVP 风险，可先只支持 Markdown/TXT/PDF，DOCX 后补。
