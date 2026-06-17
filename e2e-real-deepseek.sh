#!/bin/bash
# 真实 DeepSeek 端到端测试
set -e
KEY="sk-ddd35b8cf1d04ea88fcf8b3059f11f74"
BASE="http://localhost:37203/api"

step() { echo ""; echo "==================== $* ===================="; }
field(){ python3 -c "import sys,json;d=json.load(sys.stdin);print(d$1)"; }

step "0. 停掉 mock DeepSeek"
pkill -f mock-deepseek.mjs 2>/dev/null || true
sleep 1
echo "  已停 mock"

step "1. 管理员登录 + 清理旧 mock profile"
ADMIN_TOKEN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@harness.local","password":"admin123456"}' | field "['data']['accessToken']")
ADMIN_ID=$(curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/auth/me" | field "['data']['id']")
ORG=$(curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/auth/me" | field "['data']['organizationId']")

curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/model-profiles" \
  | jq -r '.data[] | select(.apiBaseUrl | contains("127.0.0.1:33999")) | .id' \
  | while read ID; do
      [ -n "$ID" ] && curl -fsS -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/model-profiles/$ID" > /dev/null
      echo "  删除旧 mock: $ID"
    done

step "2. 创建真实 DeepSeek ModelProfile（apiKey=$KEY）"
DS_PROFILE=$(curl -fsS -X POST "$BASE/model-profiles" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"provider\":\"DeepSeek (真实)\",
    \"apiBaseUrl\":\"https://api.deepseek.com\",
    \"apiKey\":\"$KEY\",
    \"model\":\"deepseek-chat\",
    \"systemPrompt\":\"你是 Harness AI 平台的助手。\",
    \"enabled\":true
  }")
echo "$DS_PROFILE" | jq '.data | {id, provider, model, apiBaseUrl, key_len: ((.apiKey // "") | length)}'
DS_ID=$(echo "$DS_PROFILE" | field "['data']['id']")

step "3. 创建用户 Alice"
TS=$(date +%s%N | cut -c1-13)
ALICE_EMAIL="real-ds-${TS}@harness.local"
ALICE_RESP=$(curl -fsS -X POST "$BASE/users" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"organizationId\":\"$ORG\",\"email\":\"$ALICE_EMAIL\",\"name\":\"Alice\",\"role\":\"end-user\",\"password\":\"alice-1\",\"actorUserId\":\"$ADMIN_ID\"}")
ALICE_ID=$(echo "$ALICE_RESP" | field "['data']['id']")
ALICE_TOKEN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ALICE_EMAIL\",\"password\":\"alice-1\"}" | field "['data']['accessToken']")
echo "  Alice userId=${ALICE_ID:0:8}..."

step "4. Alice 创建 DeepSeek Agent"
AGENT=$(curl -fsS -X POST "$BASE/agents" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d "{
    \"name\":\"DeepSeek 真实助手\",
    \"avatar\":\"🪄\",
    \"description\":\"用真实 DeepSeek 回答的智能体\",
    \"systemPrompt\":\"你是一个简洁的中文技术助手。回答尽量简短，不超过两句。\",
    \"welcomeMessage\":\"你好，我是 DeepSeek 真实助手。\",
    \"modelProfileId\":\"$DS_ID\",
    \"temperature\":0.5,
    \"maxTokens\":512,
    \"status\":\"active\"
  }")
echo "$AGENT" | jq '.data | {name, modelProfileId, temperature, maxTokens}'
AGENT_ID=$(echo "$AGENT" | field "['data']['id']")

step "5. 开新会话"
SID=$(curl -fsS -X POST "$BASE/agents/$AGENT_ID/sessions" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" -d '{}' \
  | field "['data']['session']['id']")
echo "  session id=${SID:0:8}..."

step "6. 真实 DeepSeek 多轮对话"
ask() {
  local q="$1"
  echo ""
  echo ">>> 用户：$q"
  local resp
  resp=$(curl -fsS -X POST "$BASE/agents/$AGENT_ID/sessions/$SID/messages" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
    -d "{\"content\":\"$q\"}")
  echo "$resp" | jq -r '
    "<<< DeepSeek (model=\(.data.model.model), mocked=\(.data.mocked))\n" +
    .data.assistantMessage.content
  '
  sleep 1
}

ask "你好，请用一句话证明你接通了 DeepSeek 真实服务。"
ask "1+1 等于几？只回答数字。"
ask "把刚才的答案翻成英文。"
ask "用一句话解释什么是 RAG 检索增强生成。"
ask "如果我想把这个 Agent 接到 RAG 知识库，需要在 systemPrompt 里做什么？"

step "7. 拉取完整历史"
curl -fsS -H "Authorization: Bearer $ALICE_TOKEN" "$BASE/agents/$AGENT_ID/sessions/$SID" | jq '
  {
    agent: .data.agent.name,
    message_count: (.data.messages | length),
    conversation: [.data.messages[] | {role, content}]
  }
'

step "8. 持久化校验"
DB_FILE=$(find /root/DataDisk/workspace/HARNESS-AI -name "admin-db.json" 2>/dev/null | head -1)
jq -r --arg sid "$SID" --arg ds "$DS_ID" '
  "  平台模型配置数 : \(.modelProfiles | length)\n" +
  "  DeepSeek profile 已配置 apiKey（长度 \((.modelProfiles[] | select(.id == $ds) | .apiKey | length))）\n" +
  "  本次会话消息数 : \([.agentMessages[] | select(.sessionId == $sid)] | length)\n" +
  "  最近 6 条 assistant 回复预览：\n" +
  ([.agentMessages[] | select(.sessionId == $sid and .role == "assistant") | "    - \(.content[0:100])"] | .[-6:] | join("\n"))
' "$DB_FILE"

echo ""
echo "==================== 真实 DeepSeek 端到端完成 ===================="