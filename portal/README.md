# Harness AI 门户（Nginx + Docker）

这是一个用于介绍本项目的静态门户站点，使用 Nginx 容器对外提供服务。

## 启动

```bash
cd portal
docker compose up -d --build
```

访问：

- HTTPS：https://localhost:30101
- HTTP（自动跳转到 HTTPS）：http://localhost:30100
- 健康检查：
  - http://localhost:30100/healthz
  - https://localhost:30101/healthz

说明：

- 端口固定分配在 30100～30150 范围内，默认使用 30100（HTTP）和 30101（HTTPS）。
- 容器会在 `portal/certs/` 下自动生成自签名证书（`tls.crt` / `tls.key`）。浏览器首次访问会提示证书不受信任，选择继续访问即可。

## 端口自定义（仍需在 30100～30150 内）

```bash
cd portal
编辑 portal/docker-compose.yml 的 ports
```

## 使用自定义证书

把证书放到 `portal/certs/`：

- `portal/certs/tls.crt`
- `portal/certs/tls.key`

然后重启容器：

```bash
cd portal
docker compose restart
```

## 修改内容

- 页面：`portal/site/index.html`
- 样式：`portal/site/styles.css`
- 脚本：`portal/site/script.js`

修改后执行：

```bash
cd portal
docker compose restart
```
