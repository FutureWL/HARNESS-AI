import { dialog, ipcMain } from 'electron'

import type { HarnessService } from '@harness/core'

function replySuccess<T>(data: T) {
  return { success: true, data, traceId: crypto.randomUUID() }
}

function replyError(error: unknown) {
  const message = error instanceof Error ? error.message : '未知错误'
  return { success: false, error: message, traceId: crypto.randomUUID() }
}

export function registerIpcHandlers(service: HarnessService) {
  ipcMain.handle('library:pickImportTargets', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择要导入的文件或文件夹',
        properties: ['openFile', 'openDirectory', 'multiSelections'],
        filters: [{ name: '支持的知识文件', extensions: ['md', 'txt', 'pdf'] }],
      })
      return replySuccess(result.canceled ? [] : result.filePaths)
    } catch (error) {
      return replyError(error)
    }
  })

  ipcMain.handle('library:importFiles', async (_event, paths: string[]) => {
    try { return replySuccess(await service.importFiles(paths)) } catch (error) { return replyError(error) }
  })
  ipcMain.handle('library:listDocuments', async (_event, query?: string) => {
    try { return replySuccess(service.listDocuments(query)) } catch (error) { return replyError(error) }
  })
  ipcMain.handle('library:getDocument', async (_event, documentId: string) => {
    try { return replySuccess(service.getDocument(documentId)) } catch (error) { return replyError(error) }
  })
  ipcMain.handle('library:updateDocumentMeta', async (_event, payload: { id: string; title: string; tags?: string[] }) => {
    try { return replySuccess(service.updateDocumentMeta(payload)) } catch (error) { return replyError(error) }
  })
  ipcMain.handle('search:query', async (_event, payload: { query: string; limit?: number }) => {
    try { return replySuccess(service.search(payload.query, payload.limit)) } catch (error) { return replyError(error) }
  })
  ipcMain.handle('chat:ask', async (_event, payload: { question: string; sessionId?: string }) => {
    try { return replySuccess(await service.ask(payload.question, payload.sessionId ?? 'main')) } catch (error) { return replyError(error) }
  })
  ipcMain.handle('chat:listMessages', async (_event, sessionId?: string) => {
    try { return replySuccess(service.listMessages(sessionId ?? 'main')) } catch (error) { return replyError(error) }
  })
  ipcMain.handle('settings:get', async () => {
    try { return replySuccess(service.getSettings()) } catch (error) { return replyError(error) }
  })
  ipcMain.handle('settings:update', async (_event, payload: Record<string, string>) => {
    try { return replySuccess(service.updateSettings(payload)) } catch (error) { return replyError(error) }
  })
}
