#!/bin/bash
# 智能体（Agent）端到端测试
set -e
BASE="http://localhost:33203/api"
pp()   { jq .; }
field(){ python3 -c "import sys,json;d=json.load(sys.stdin);print(d$1)"; }
step() { echo ""; echo "==================== $* ===================="; }

# ── 0. 登录 ─────────────────────────────────────────────
step "0. 管理员登录"
ADMIN_TOKEN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@harness.local","password":"admin123456"}' | field "['data']['accessToken']")
ADMIN_ID=$(curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/auth/me" | field "['data']['id']")
echo "admin id = ${ADMIN_ID:0:8}..."

# ── 1. 列出可用模型配置 ─────────────────────────────────
step "1. 列出可用模型（用户自定义数据）"
PROFILES=$(curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/model-profiles")
echo "$PROFILES" | pp
PROFILE_ID=$(echo "$PROFILES" | field "['data'][0]['id']")
echo "选用模型 profile = $PROFILE_ID"

# ── 2. 用户 Alice 登录 ──────────────────────────────────
step "2. 用户 Alice 登录"
TS=$(date +%s%N | cut -c1-13)
ALICE_EMAIL="alice-${TS}@harness.local"
ALICE_ID=$(curl -fsS -X POST "$BASE/users" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"organizationId\":\"$(curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/auth/me" | field "['data']['organizationId']")\",\"email\":\"$ALICE_EMAIL\",\"name\":\"Alice\",\"role\":\"end-user\",\"password\":\"alice-pwd-1\",\"actorUserId\":\"$ADMIN_ID\"}" | field "['data']['id']")
echo "Alice userId = ${ALICE_ID:0:8}..."

ALICE_TOKEN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ALICE_EMAIL\",\"password\":\"alice-pwd-1\"}" | field "['data']['accessToken']")
echo "Alice 登录成功"

# ── 3. Alice 创建三个不同人设的智能体 ────────────────────
step "3a. Alice 创建智能体 #1：项目知识助手"
A1=$(curl -fsS -X POST "$BASE/agents" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d "{
    \"name\":\"项目知识助手\",
    \"avatar\":\"📚\",
    \"description\":\"专攻本项目代码与文档\",
    \"systemPrompt\":\"你是一名严谨的架构师，回答时：(1)优先引用 RAG 检索结果；(2)使用简洁的中文；(3)拒绝回答与项目无关的问题。\",
    \"welcomeMessage\":\"你好，我是项目知识助手。可以问我架构、模块拆分或 API 用法。\",
    \"modelProfileId\":\"$PROFILE_ID\",
    \"temperature\":0.4,
    \"maxTokens\":2048,
    \"topP\":0.95,
    \"status\":\"active\"
  }")
echo "$A1" | pp
A1_ID=$(echo "$A1" | field "['data']['id']")

step "3b. Alice 创建智能体 #2：创意写作伙伴"
A2=$(curl -fsS -X POST "$BASE/agents" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d "{
    \"name\":\"创意写作伙伴\",
    \"avatar\":\"🎨\",
    \"description\":\"擅长头脑风暴、文案润色\",
    \"systemPrompt\":\"你是一个脑洞很大的创意伙伴，擅长用比喻和故事回答，鼓励用户跳出常规思维。\",
    \"welcomeMessage\":\"嗨～想一起创作点什么？\",
    \"temperature\":1.1,
    \"topP\":0.9,
    \"status\":\"active\"
  }")
A2_ID=$(echo "$A2" | field "['data']['id']")
echo "agent #2 id = ${A2_ID:0:8}..."

step "3c. Alice 创建智能体 #3：默认停用"
A3=$(curl -fsS -X POST "$BASE/agents" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d "{
    \"name\":\"运维排障机器人\",
    \"avatar\":\"🛠️\",
    \"description\":\"尚未启用的运维助手\",
    \"systemPrompt\":\"你是运维工程师，专注排障。\",
    \"status\":\"disabled\"
  }")
A3_ID=$(echo "$A3" | field "['data']['id']")
echo "agent #3 id = ${A3_ID:0:8}... (disabled)"

# ── 4. 列出 Alice 的所有智能体 ──────────────────────────
step "4. Alice 的智能体列表"
curl -fsS -H "Authorization: Bearer $ALICE_TOKEN" "$BASE/agents" | jq '
  .data | "智能体数量: \(length)\n" +
  (map("  - [\(.status)] \(.avatar) \(.name)  (id=\(.id[0:8]) temp=\(.temperature))") | join("\n"))
'

# ── 5. 修改智能体 #1 ────────────────────────────────────
step "5. 修改智能体 #1 的温度和欢迎语"
curl -fsS -X PATCH "$BASE/agents/$A1_ID" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"temperature":0.5,"welcomeMessage":"欢迎回来，我可以帮你查文档、解 API。"}' | jq '.data | {name, temperature, welcomeMessage}'

# ── 6. 复制智能体 #1 ────────────────────────────────────
step "6. 复制智能体 #1"
curl -fsS -X POST "$BASE/agents/$A1_ID/duplicate" \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.data | {name, status, id}'

# ── 7. 与智能体 #1 创建会话并多轮对话 ───────────────────
step "7a. 与《项目知识助手》创建会话"
S1=$(curl -fsS -X POST "$BASE/agents/$A1_ID/sessions" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"title":"架构问答"}')
echo "$S1" | jq '.data | {session: .session.id, agent: .agent.name, welcomeMessage}'
S1_ID=$(echo "$S1" | field "['data']['session']['id']")

step "7b. 第 1 轮对话：问架构"
curl -fsS -X POST "$BASE/agents/$A1_ID/sessions/$S1_ID/messages" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"content":"本项目的整体架构是怎样的？分成哪几层？"}' | jq '
  .data | {
    agent: .agent.name,
    temperature: .agent.temperature,
    reply_preview: (.assistantMessage.content[0:120] + "..."),
    mocked: .mocked
  }
'

step "7c. 第 2 轮对话：追问具体模块"
curl -fsS -X POST "$BASE/agents/$A1_ID/sessions/$S1_ID/messages" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"content":"packages/core 的 HarnessService 主要承担什么职责？"}' | jq '
  .data.assistantMessage | {role, content_preview: (.content[0:120] + "...")}
'

# ── 8. 与智能体 #2 开另一个会话 ─────────────────────────
step "8. 与《创意写作伙伴》开新会话"
S2=$(curl -fsS -X POST "$BASE/agents/$A2_ID/sessions" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" -d '{}')
S2_ID=$(echo "$S2" | field "['data']['session']['id']")
curl -fsS -X POST "$BASE/agents/$A2_ID/sessions/$S2_ID/messages" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"content":"帮我写一句产品 Slogan，主题是给知识工作者的桌面 AI 助手"}' | jq '
  .data | {
    agent: .agent.name,
    temperature: .agent.temperature,
    reply_preview: (.assistantMessage.content[0:120] + "..."),
  }
'

# ── 9. 用户隔离：Bob 看不到 Alice 的智能体 ──────────────
step "9. 用户隔离验证：Bob 登录后看不到 Alice 的智能体"
BOB_EMAIL="bob-${TS}@harness.local"
BOB_TOKEN=$(curl -fsS -X POST "$BASE/users" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"organizationId\":\"$(curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/auth/me" | field "['data']['organizationId']")\",\"email\":\"$BOB_EMAIL\",\"name\":\"Bob\",\"role\":\"end-user\",\"password\":\"bob-pwd-2\",\"actorUserId\":\"$ADMIN_ID\"}" > /dev/null && \
  curl -fsS -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$BOB_EMAIL\",\"password\":\"bob-pwd-2\"}" | field "['data']['accessToken']")
echo "Bob 智能体列表："
curl -fsS -H "Authorization: Bearer $BOB_TOKEN" "$BASE/agents" | jq '.data | length as $n | "  Bob 看到的智能体数量: \($n)"'

echo "Alice 直接访问 Bob 的会话应当 404："
curl -s -o /dev/null -w "  HTTP %{http_code}\n" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  "$BASE/agents/$A1_ID/sessions/00000000-0000-0000-0000-000000000000"

# ── 10. 拉取完整历史 ────────────────────────────────────
step "10. Alice 的智能体 #1 会话完整历史"
curl -fsS -H "Authorization: Bearer $ALICE_TOKEN" "$BASE/agents/$A1_ID/sessions/$S1_ID" | jq '
  {
    agent: .data.agent.name,
    session: .data.session.title,
    message_count: (.data.messages | length),
    messages: [.data.messages[] | {role, preview: (.content[0:60])}]
  }
'

# ── 11. 停用智能体后再开新会话应被拒绝 ──────────────────
step "11. 停用的智能体不能开新会话"
curl -fsS -X PATCH "$BASE/agents/$A3_ID" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"status":"active"}' > /dev/null
curl -fsS -X PATCH "$BASE/agents/$A3_ID" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"status":"disabled"}' > /dev/null
S_DISABLED=$(curl -s -X POST "$BASE/agents/$A3_ID/sessions" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ALICE_TOKEN" -d '{}')
echo "$S_DISABLED" | jq '.error // .message // .'

# ── 12. 审计日志中 agent 痕迹 ──────────────────────────
step "12. 审计日志：智能体相关动作"
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/audit-logs" | jq '
  [.data[] | select(.action | startswith("agent."))][0:8] |
  map("  [\(.createdAt[11:19])] \(.action | .[0:24])  \(.detail)") | join("\n")
'

# ── 13. 持久化校验 ──────────────────────────────────────
step "13. 持久化文件"
DB_FILE=$(find /root/DataDisk/workspace/HARNESS-AI -name "admin-db.json" 2>/dev/null | head -1)
jq -r '
  "  智能体数     : \(.agents | length)\n" +
  "  智能体会话数 : \(.agentSessions | length)\n" +
  "  智能体消息数 : \(.agentMessages | length)\n"
' "$DB_FILE"
echo ""
echo "  智能体清单："
jq -r '
  .agents[] |
  "    - [\(.status)] \(.avatar) \(.name)  owner=\(.userId[0:8])...  temp=\(.temperature)  prompt_len=\(.systemPrompt | length)"
' "$DB_FILE"

echo ""
echo "==================== 智能体演示完成 ===================="