# Harness AI

一个面向知识工作者的个人知识 harness 桌面应用原型。

## 当前能力

- 导入本地 Markdown、TXT、PDF 文件
- 将文档切片并保存到本地 SQLite 数据库
- 基于本地索引执行搜索检索
- 使用可配置 OpenAI 兼容接口进行 RAG 问答
- 在桌面端查看知识库、搜索结果、问答记录与模型设置

## 目录结构

- `apps/renderer`: React + Vite 前端界面
- `apps/desktop`: Electron 主进程与 IPC
- `packages/shared`: 跨端类型定义
- `packages/core`: 本地知识库核心逻辑

## 启动方式

```bash
pnpm install
pnpm dev
```
