#!/bin/bash
# DeepSeek 接入演示：
#   1) 起本地 mock DeepSeek（如果没真实 key）
#   2) 在 Harness AI 平台创建指向 DeepSeek 的 ModelProfile
#   3) 创建使用该模型的 Agent
#   4) 与 Agent 多轮对话，验证 wire 格式 100% 兼容
#
# 真实 DeepSeek 接入：把下面的 MOCK_BASE 换成 https://api.deepseek.com，
#                     KEY 换成你在 platform.deepseek.com 申请的值即可。
set -e
BASE="http://localhost:37203/api"
pp()   { jq .; }
field(){ python3 -c "import sys,json;d=json.load(sys.stdin);print(d$1)"; }
step() { echo ""; echo "==================== $* ===================="; }

# ─── 配置区 ──────────────────────────────────────────────
MOCK_BASE="http://127.0.0.1:33999"
# 真实 DeepSeek 配置示例（注释保留）：
# DEEPSEEK_BASE="https://api.deepseek.com"
# DEEPSEEK_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
# DEEPSEEK_MODEL="deepseek-v4-flash"
DEEPSEEK_MODEL="deepseek-v4-flash"   # 也可填 deepseek-v4-pro / deepseek-chat / deepseek-reasoner
KEY="${DEEPSEEK_API_KEY:-mock-key-for-demo}"

# ─── 0. 启动 mock DeepSeek（如果用了真实 key，可以跳过这一步）───────
step "0. 启动 mock DeepSeek（端口 33999）"
if [ "$KEY" = "mock-key-for-demo" ]; then
  if ! ss -tln 2>/dev/null | grep -q ":33999 "; then
    setsid node /root/DataDisk/workspace/HARNESS-AI/scripts/mock-deepseek.mjs \
      </dev/null >/tmp/mock-deepseek.log 2>&1 &
    disown
    sleep 1
  fi
  echo "mock 服务已起（PID via ss / port 33999）"
  curl -s -o /dev/null -w "  mock 健康: HTTP %{http_code}\n" -X POST $MOCK_BASE/chat/completions \
    -H "Content-Type: application/json" -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"ping"}]}'
  USE_BASE=$MOCK_BASE
  NOTE="（本地 mock）"
else
  USE_BASE="${DEEPSEEK_BASE:-https://api.deepseek.com}"
  NOTE="（真实 DeepSeek）"
fi
echo "  apiBaseUrl = $USE_BASE"
echo "  apiKey     = ${KEY:0:4}****..."
echo "  model      = $DEEPSEEK_MODEL"

# ─── 1. 管理员登录 ──────────────────────────────────────
step "1. 管理员登录"
ADMIN_TOKEN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@harness.local","password":"admin123456"}' | field "['data']['accessToken']")
echo "  token = ${ADMIN_TOKEN:0:24}..."

# ─── 2. 创建/复用 DeepSeek 模型配置 ─────────────────────
step "2. 创建 DeepSeek ModelProfile $NOTE"
ORG=$(curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/auth/me" | field "['data']['organizationId']")
ADMIN_ID=$(curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/auth/me" | field "['data']['id']")

# 复用平台已有的"新增模型配置"端点
DS_PROFILE_ID=$(curl -fsS -X POST "$BASE/model-profiles" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"provider\":\"DeepSeek (OpenAI Compatible)\",
    \"apiBaseUrl\":\"$USE_BASE\",
    \"apiKey\":\"$KEY\",
    \"model\":\"$DEEPSEEK_MODEL\",
    \"systemPrompt\":\"你是 DeepSeek 驱动的助手。\",
    \"enabled\":true
  }" | jq -r '.data.id')
echo "  profile id = $DS_PROFILE_ID"

# 验证：调一次 GET /api/model-profiles
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/model-profiles" | jq --arg id "$DS_PROFILE_ID" '
  .data[] | select(.id == $id) | "  已写入: provider=\(.provider)  base=\(.apiBaseUrl)  model=\(.model)  key=\(.apiKey[0:4])****"
'

# ─── 3. 用户 Alice 登录，并创建 DeepSeek Agent ──────────
step "3. Alice 登录 + 创建 DeepSeek Agent"
TS=$(date +%s%N | cut -c1-13)
ALICE_EMAIL="alice-deepseek-${TS}@harness.local"
ALICE_ID=$(curl -fsS -X POST "$BASE/users" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"organizationId\":\"$ORG\",\"email\":\"$ALICE_EMAIL\",\"name\":\"Alice\",\"role\":\"end-user\",\"password\":\"alice-pwd-1\",\"actorUserId\":\"$ADMIN_ID\"}" | field "['data']['id']")
ALICE_TOKEN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ALICE_EMAIL\",\"password\":\"alice-pwd-1\"}" | field "['data']['accessToken']")

curl -fsS -X POST "$BASE/agents" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d "{
    \"name\":\"DeepSeek 助手\",
    \"avatar\":\"🪄\",
    \"description\":\"由 DeepSeek 驱动的智能体 $NOTE\",
    \"systemPrompt\":\"你是一个严谨的中文技术助手，回答简短精确。\",
    \"welcomeMessage\":\"你好，我是 DeepSeek 助手。\",
    \"modelProfileId\":\"$DS_PROFILE_ID\",
    \"temperature\":0.6,
    \"maxTokens\":1024,
    \"topP\":0.9,
    \"status\":\"active\"
  }" | jq '.data | {id, name, modelProfileId, temperature, maxTokens}'

AGENT_ID=$(curl -fsS -H "Authorization: Bearer $ALICE_TOKEN" "$BASE/agents" | jq -r '.data[0].id')
echo "  agent id = ${AGENT_ID:0:8}..."

# ─── 4. 开启会话 + 多轮对话 ──────────────────────────────
step "4. 与 DeepSeek Agent 多轮对话"
SESSION=$(curl -fsS -X POST "$BASE/agents/$AGENT_ID/sessions" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" -d '{}')
SID=$(echo "$SESSION" | field "['data']['session']['id']")
echo "  session id = ${SID:0:8}..."

step "4a. 第 1 轮：自我介绍"
curl -fsS -X POST "$BASE/agents/$AGENT_ID/sessions/$SID/messages" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"content":"你好，请用一句话介绍你自己。"}' | jq '
  .data | {
    mocked,
    model: (.model.model // "(无模型)"),
    reply: .assistantMessage.content
  }
'

step "4b. 第 2 轮：技术问答"
curl -fsS -X POST "$BASE/agents/$AGENT_ID/sessions/$SID/messages" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"content":"Harness AI 平台用了哪些技术栈？"}' | jq '
  .data | {
    mocked,
    model: (.model.model // "(无模型)"),
    reply: .assistantMessage.content
  }
'

step "4c. 第 3 轮：要求按 system prompt 的语气回答"
curl -fsS -X POST "$BASE/agents/$AGENT_ID/sessions/$SID/messages" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"content":"什么是 RAG？请用一句中文回答。"}' | jq '
  .data | {
    mocked,
    reply_preview: (.assistantMessage.content[0:120] + "...")
  }
'

# ─── 5. 拉取完整历史，确认消息已持久化 ──────────────────
step "5. 完整对话历史"
curl -fsS -H "Authorization: Bearer $ALICE_TOKEN" "$BASE/agents/$AGENT_ID/sessions/$SID" | jq '
  {
    agent: .data.agent.name,
    message_count: (.data.messages | length),
    messages: [.data.messages[] | {role, preview: (.content[0:80])}]
  }
'

# ─── 6. 演示结束，关闭 mock（如果启了） ────────────────
step "6. 清理"
if [ "$KEY" = "mock-key-for-demo" ]; then
  pkill -f mock-deepseek.mjs 2>/dev/null || true
  echo "  mock DeepSeek 已停止"
fi
echo "  mock 日志最后 5 行："
tail -5 /tmp/mock-deepseek.log 2>/dev/null || echo "  (无日志)"

echo ""
echo "==================== DeepSeek 接入演示完成 ===================="
echo ""
echo "切到真实 DeepSeek 的方法："
echo "  1. 到 https://platform.deepseek.com/api_keys 申请 API Key"
echo "  2. 把 'e2e-deepseek.sh' 顶部的 KEY 改成你的真实 key"
echo "  3. (可选) 把 MOCK_BASE 改成 https://api.deepseek.com"
echo "  4. 重跑 ./e2e-deepseek.sh，对话就会打到真实 DeepSeek"