import { contextBridge, ipcRenderer } from 'electron'

const harness = {
  pickImportTargets: () => ipcRenderer.invoke('library:pickImportTargets'),
  importFiles: (paths: string[]) => ipcRenderer.invoke('library:importFiles', paths),
  listDocuments: (query?: string) => ipcRenderer.invoke('library:listDocuments', query),
  getDocument: (documentId: string) => ipcRenderer.invoke('library:getDocument', documentId),
  updateDocumentMeta: (payload: { id: string; title: string; tags?: string[] }) => ipcRenderer.invoke('library:updateDocumentMeta', payload),
  search: (payload: { query: string; limit?: number }) => ipcRenderer.invoke('search:query', payload),
  ask: (payload: { question: string; sessionId?: string }) => ipcRenderer.invoke('chat:ask', payload),
  listMessages: (sessionId?: string) => ipcRenderer.invoke('chat:listMessages', sessionId),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (payload: Record<string, string>) => ipcRenderer.invoke('settings:update', payload),
}

contextBridge.exposeInMainWorld('harness', harness)
