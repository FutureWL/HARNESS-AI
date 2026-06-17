#!/bin/bash
# Harness AI 平台端到端演示：多用户 + 用户自定义 + LLM 对话 + 聊天记录持久化
set -e
BASE="http://localhost:33203/api"

step() { echo ""; echo "==================== $* ===================="; }
pp()   { jq .; }
field(){ python3 -c "import sys,json;d=json.load(sys.stdin);print(d$1)"; }

# ── 0. 健康检查 ───────────────────────────────────────────
step "0. 平台健康检查"
curl -fsS "$BASE/health" | pp

# ── 1. 管理员登录 ─────────────────────────────────────────
step "1. 管理员登录（admin@harness.local / admin123456）"
ADMIN_RESP=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@harness.local","password":"admin123456"}')
echo "$ADMIN_RESP" | pp
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | field "['data']['accessToken']")
ADMIN_ID=$(echo "$ADMIN_RESP"    | field "['data']['profile']['id']")
ADMIN_ORG=$(echo "$ADMIN_RESP"   | field "['data']['profile']['organizationId']")
echo "管理员 token: ${ADMIN_TOKEN:0:32}..."

# ── 2. 查看模型配置（用户自定义数据） ────────────────────
step "2. 查看现有模型配置（用户自定义数据）"
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/chat/profiles" | pp

# ── 3. 管理员创建两个新用户 ──────────────────────────────
TS=$(date +%s%N | cut -c1-13)
ALICE_EMAIL="alice-${TS}@harness.local"
BOB_EMAIL="bob-${TS}@harness.local"

step "3a. 管理员创建用户 Alice ($ALICE_EMAIL)"
ALICE_RESP=$(curl -fsS -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"organizationId\":\"$ADMIN_ORG\",\"email\":\"${ALICE_EMAIL}\",\"name\":\"Alice\",\"role\":\"end-user\",\"password\":\"alice-pwd-1\",\"actorUserId\":\"$ADMIN_ID\"}")
echo "$ALICE_RESP" | pp

step "3b. 管理员创建用户 Bob ($BOB_EMAIL)"
BOB_RESP=$(curl -fsS -X POST "$BASE/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"organizationId\":\"$ADMIN_ORG\",\"email\":\"${BOB_EMAIL}\",\"name\":\"Bob\",\"role\":\"end-user\",\"password\":\"bob-pwd-2\",\"actorUserId\":\"$ADMIN_ID\"}")
echo "$BOB_RESP" | pp

# ── 4. Alice 登录平台，发起对话 ──────────────────────────
step "4a. Alice 登录"
ALICE_LOGIN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ALICE_EMAIL}\",\"password\":\"alice-pwd-1\"}")
ALICE_TOKEN=$(echo "$ALICE_LOGIN" | field "['data']['accessToken']")
echo "Alice 登录成功，token: ${ALICE_TOKEN:0:32}..."

step "4b. Alice 创建会话"
ALICE_SESSION=$(curl -fsS -X POST "$BASE/chat/sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"title":"Alice 的项目助手"}')
echo "$ALICE_SESSION" | pp
ALICE_SID=$(echo "$ALICE_SESSION" | field "['data']['id']")

step "4c. Alice 第 1 轮对话：问 RAG"
curl -fsS -X POST "$BASE/chat/sessions/$ALICE_SID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"content":"请用一句话解释什么是 RAG 检索增强生成。"}' | pp

step "4d. Alice 第 2 轮对话：追问 FTS"
curl -fsS -X POST "$BASE/chat/sessions/$ALICE_SID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"content":"那 SQLite FTS5 在本地知识库里有什么优势？"}' | pp

# ── 5. Bob 独立登录并发起对话 ────────────────────────────
step "5. Bob 登录并独立对话"
BOB_LOGIN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${BOB_EMAIL}\",\"password\":\"bob-pwd-2\"}")
BOB_TOKEN=$(echo "$BOB_LOGIN" | field "['data']['accessToken']")

BOB_SESSION=$(curl -fsS -X POST "$BASE/chat/sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{"title":"Bob 的代码助手"}')
BOB_SID=$(echo "$BOB_SESSION" | field "['data']['id']")
echo "Bob 的会话 ID: $BOB_SID"

curl -fsS -X POST "$BASE/chat/sessions/$BOB_SID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{"content":"用 Node.js 写一个读取 JSON 文件的代码示例。"}' | pp

# ── 6. 用户隔离验证 ─────────────────────────────────────
step "6a. 用户隔离：Alice 只能看到自己的会话"
curl -fsS -H "Authorization: Bearer $ALICE_TOKEN" "$BASE/chat/sessions" | jq '
  .data | "Alice 看到的会话数: \(length)\n" +
         (map("  - " + .title + "  (id=" + (.id[0:8]) + ")") | join("\n"))
'

step "6b. 用户隔离：Alice 越权访问 Bob 会话（应返回 404）"
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  "$BASE/chat/sessions/$BOB_SID"

# ── 7. 查看 Alice 的完整聊天记录 ─────────────────────────
step "7. Alice 会话详情（含完整历史）"
curl -fsS -H "Authorization: Bearer $ALICE_TOKEN" "$BASE/chat/sessions/$ALICE_SID" | jq '
  {
    session_title: .data.title,
    session_owner: .data.userId[0:8],
    updated_at: .data.updatedAt,
    message_count: (.data.messages | length),
    messages: [.data.messages[] | {role, content}]
  }
'

# ── 8. 审计日志 ──────────────────────────────────────────
step "8. 审计日志（管理员视角）"
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/audit-logs" | jq '
  .data[0:10] | map("  [\(.createdAt[11:19])] \(.action | .[0:30])  \(.detail)") | join("\n")
'

# ── 9. 持久化落盘 ───────────────────────────────────────
step "9. 聊天记录持久化文件"
DB_FILE=$(find /root/DataDisk/workspace/HARNESS-AI -name "admin-db.json" 2>/dev/null | head -1)
echo "落盘文件: $DB_FILE"
ls -la "$DB_FILE"
echo ""
jq -r '
  "  持久化用户数 : \(.users | length)\n" +
  "  聊天会话数   : \(.chatSessions | length)\n" +
  "  聊天消息总数 : \(.chatMessages | length)\n"
' "$DB_FILE"

echo ""
echo "  详细会话列表:"
jq -r '
  .chatSessions[] as $s |
  ($s.id) as $sid |
  ([.chatMessages[] | select(.sessionId == $sid)] | length) as $cnt |
  (.users[] | select(.id == $s.userId).name) as $owner |
  "    - 标题=\"\($s.title)\"  owner=\($owner)  消息数=\($cnt)"
' "$DB_FILE"

echo ""
echo "==================== 演示完成 ===================="