// scripts/mock-deepseek.mjs
// 本地 mock DeepSeek OpenAI 兼容端点，用于在没有真实 key 时端到端验证平台接入
import http from 'node:http'

const PORT = Number(process.env.MOCK_PORT || 33999)

const server = http.createServer(async (req, res) => {
  // CORS 允许 admin-api 反向探测
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname !== '/chat/completions' && url.pathname !== '/v1/chat/completions') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not_found' }))
    return
  }

  let body = ''
  for await (const chunk of req) body += chunk
  let parsed = {}
  try {
    parsed = JSON.parse(body)
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'invalid_json' }))
    return
  }

  const messages = parsed.messages || []
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const systemPrompt = messages.find((m) => m.role === 'system')?.content || ''
  const userContent = lastUser?.content || ''
  const echo = userContent.length > 80 ? `${userContent.slice(0, 80)}…` : userContent
  const stamp = new Date().toLocaleString('zh-CN', { hour12: false })

  const reply = [
    '【mock-deepseek · 本地模拟】',
    `模型 = ${parsed.model || 'unknown'}`,
    `温度 = ${parsed.temperature ?? '-'}  max_tokens = ${parsed.max_tokens ?? '-'}  top_p = ${parsed.top_p ?? '-'}`,
    `system_prompt 前 60 字 = ${systemPrompt.slice(0, 60)}${systemPrompt.length > 60 ? '…' : ''}`,
    `你刚刚说：${echo}`,
    `本响应来自本地 mock，证明 Harness AI 平台的请求格式与 DeepSeek 100% 兼容。`,
    `接入真实 DeepSeek：把 apiBaseUrl 改成 https://api.deepseek.com，apiKey 填你在 platform.deepseek.com 申请的值即可。`,
    `调用时间：${stamp}`,
  ].join('\n')

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(
    JSON.stringify({
      id: `mock-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: parsed.model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: reply },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: messages.reduce((acc, m) => acc + (m.content?.length || 0), 0),
        completion_tokens: reply.length,
        total_tokens: messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) + reply.length,
      },
    }),
  )
})

server.listen(PORT, () => {
  console.log(`[mock-deepseek] listening on http://127.0.0.1:${PORT}`)
  console.log(`[mock-deepseek] accepts POST /chat/completions and /v1/chat/completions`)
})