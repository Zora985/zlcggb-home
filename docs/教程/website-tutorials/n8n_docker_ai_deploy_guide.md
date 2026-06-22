# n8n Docker Desktop 部署与 AI 大模型连通防踩坑指南

> 版本：2026-06-16（含界面中文化 3.7）  
> 适用对象：已经安装 Docker Desktop，希望用命令行部署 n8n，并接入 OpenAI / Claude / OpenRouter / Azure OpenAI / Ollama / 本地 OpenAI-compatible API 的用户。  
> 重点问题：n8n 能打开，但 AI 大模型节点连不上；或者明明填了 API Key、Base URL、模型名，但仍然 timeout / ENOTFOUND / ECONNREFUSED / SSL error。

---

## 0. 先给结论

如果你只是“下载 Docker App，然后命令行安装 n8n”，最稳妥的路线不是直接 `docker run`，而是：

1. **用 Docker Compose 部署 n8n**，保证环境变量、持久化目录、代理配置可重复。
2. **先验证 Docker 容器内能访问模型 API**，再去 n8n UI 里配置大模型。
3. **把“宿主机代理”和“容器内代理”分开处理**。宿主机能访问 OpenAI，不代表 n8n 容器能访问。
4. **本地模型 / 本机代理 / Ollama 这类服务，不要在容器里写 `localhost`**。容器里的 `localhost` 是容器自己，不是你的电脑。
5. **本地 HTTP 部署要设置 `N8N_SECURE_COOKIE=false`**；公网 HTTPS 部署要设回 `true`。
6. **固定 `N8N_ENCRYPTION_KEY`**。否则迁移、重建、队列模式、凭据读取都可能出问题。
7. **如果用 Windows 路径 bind mount，注意 n8n 配置文件权限问题**；更推荐用 Docker named volume 保存 `.n8n` 数据。
8. **n8n 官方界面只有英文**；需要中文时，用社区汉化包 + `N8N_DEFAULT_LOCALE=zh-CN` + Docker 卷挂载（见 [3.7](#37-界面中文化可选)）。

---

## 1. 为什么“配置了大模型也没用”

你遇到的“配置了也连不上”，通常不是一个单点问题，而是下面几层之一：

| 层级 | 典型错误 | 真实含义 |
|---|---|---|
| Docker 镜像层 | 镜像拉不下来 | Docker Desktop / Docker daemon 访问 Docker Registry 有问题 |
| Docker 容器网络层 | `ETIMEDOUT` / `ENOTFOUND` | n8n 容器访问不了外网或 DNS 解析失败 |
| 代理层 | 宿主机能访问，容器不行 | 代理只配置在电脑上，没传进容器或 n8n |
| n8n 配置层 | webhook / OAuth 回调错误 | `WEBHOOK_URL`、`N8N_HOST`、`N8N_PROTOCOL`、反向代理头配置不对 |
| AI 服务层 | 401 / 403 / 429 / insufficient quota | API Key、账户额度、组织、项目、限流或 IP 限制问题 |
| 本地模型层 | `ECONNREFUSED localhost:11434` | 容器把 `localhost` 当成 n8n 容器自己，而不是你的电脑 |

**核心判断方法：**

> 先不要在 n8n 里反复改模型配置。  
> 先在 n8n 容器内测试能否访问模型 API。  
> 容器内网络不通，n8n UI 里填什么都没用。

---

## 2. 准备工作

### 2.1 确认 Docker 可用

```bash
docker --version
docker compose version
```

如果这两个命令都能正常输出版本号，说明 Docker Desktop 的命令行基本可用。

---

## 3. 推荐方案 A：本地 n8n，适合学习和个人自动化

这个方案适合：

- 在自己的电脑上运行；
- 通过 `http://localhost:5678` 打开；
- 暂时不需要公网 webhook；
- 重点是先把 n8n + AI 节点跑通。

### 3.1 创建目录

macOS / Linux：

```bash
mkdir -p ~/n8n-docker
cd ~/n8n-docker
mkdir -p files
```

Windows PowerShell：

```powershell
mkdir $HOME\n8n-docker
cd $HOME\n8n-docker
mkdir files
```

---

### 3.2 生成加密密钥

macOS / Linux / Windows PowerShell 都可以用：

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

复制输出结果，后面填到 `.env` 的 `N8N_ENCRYPTION_KEY`。

> 这个 key 不要随便改。它关系到 n8n 凭据加密。重建容器时，只要数据卷和这个 key 保持一致，凭据通常就可以继续读取。

---

### 3.3 创建 `.env`

macOS / Linux：

```bash
cat > .env <<'EOF'
# -----------------------------
# n8n basic
# -----------------------------
N8N_IMAGE=docker.n8n.io/n8nio/n8n:stable
N8N_PORT=5678

# 本地访问
N8N_HOST=localhost
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/
N8N_EDITOR_BASE_URL=http://localhost:5678/

# 本地 HTTP 必须 false；公网 HTTPS 再改 true
N8N_SECURE_COOKIE=false

# 时区：你也可以用 Asia/Shanghai / Asia/Hong_Kong / America/Los_Angeles
GENERIC_TIMEZONE=Asia/Shanghai

# 请替换成你自己生成的 64 位随机字符串
N8N_ENCRYPTION_KEY=replace_this_with_your_generated_key

# n8n 2.x 前后建议显式开启 task runners
N8N_RUNNERS_ENABLED=true

# 使用 named volume 时通常可以 true
# 如果你在 Windows 上把 .n8n 直接挂载到本机路径并遇到权限报错，可改 false
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true

# -----------------------------
# Proxy：默认不启用
# -----------------------------
HTTP_PROXY=
HTTPS_PROXY=
ALL_PROXY=
NO_PROXY=localhost,127.0.0.1,::1,host.docker.internal,n8n,postgres,redis,ollama
EOF
```

Windows PowerShell：

```powershell
@'
# -----------------------------
# n8n basic
# -----------------------------
N8N_IMAGE=docker.n8n.io/n8nio/n8n:stable
N8N_PORT=5678

N8N_HOST=localhost
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/
N8N_EDITOR_BASE_URL=http://localhost:5678/

N8N_SECURE_COOKIE=false
GENERIC_TIMEZONE=Asia/Shanghai
N8N_ENCRYPTION_KEY=replace_this_with_your_generated_key
N8N_RUNNERS_ENABLED=true
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true

HTTP_PROXY=
HTTPS_PROXY=
ALL_PROXY=
NO_PROXY=localhost,127.0.0.1,::1,host.docker.internal,n8n,postgres,redis,ollama
'@ | Set-Content -Encoding utf8 .env
```

然后手动把：

```env
N8N_ENCRYPTION_KEY=replace_this_with_your_generated_key
```

改成你刚才生成的随机字符串。

---

### 3.4 创建 `compose.yaml`

macOS / Linux：

```bash
cat > compose.yaml <<'EOF'
name: n8n-local

services:
  n8n:
    image: ${N8N_IMAGE:-docker.n8n.io/n8nio/n8n:stable}
    container_name: n8n
    restart: unless-stopped

    ports:
      # 本地部署建议只绑定 127.0.0.1，避免局域网或公网误暴露
      - "127.0.0.1:${N8N_PORT:-5678}:5678"

    environment:
      N8N_HOST: ${N8N_HOST:-localhost}
      N8N_PORT: 5678
      N8N_PROTOCOL: ${N8N_PROTOCOL:-http}
      WEBHOOK_URL: ${WEBHOOK_URL:-http://localhost:5678/}
      N8N_EDITOR_BASE_URL: ${N8N_EDITOR_BASE_URL:-http://localhost:5678/}

      N8N_SECURE_COOKIE: ${N8N_SECURE_COOKIE:-false}
      GENERIC_TIMEZONE: ${GENERIC_TIMEZONE:-Asia/Shanghai}
      TZ: ${GENERIC_TIMEZONE:-Asia/Shanghai}

      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_RUNNERS_ENABLED: ${N8N_RUNNERS_ENABLED:-true}
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: ${N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS:-true}

      # 代理环境变量：默认空；需要代理时在 .env 里填写
      HTTP_PROXY: ${HTTP_PROXY:-}
      HTTPS_PROXY: ${HTTPS_PROXY:-}
      ALL_PROXY: ${ALL_PROXY:-}
      NO_PROXY: ${NO_PROXY:-localhost,127.0.0.1,::1,host.docker.internal,n8n,postgres,redis,ollama}

    volumes:
      # n8n 数据、凭据、workflow、sqlite 数据库等都在这里
      - n8n_data:/home/node/.n8n

      # 给 Read/Write Files from Disk 节点使用
      - ./files:/files

    healthcheck:
      test: ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:5678/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""]
      interval: 30s
      timeout: 10s
      retries: 10

volumes:
  n8n_data:
EOF
```

Windows PowerShell：

```powershell
@'
name: n8n-local

services:
  n8n:
    image: ${N8N_IMAGE:-docker.n8n.io/n8nio/n8n:stable}
    container_name: n8n
    restart: unless-stopped

    ports:
      - "127.0.0.1:${N8N_PORT:-5678}:5678"

    environment:
      N8N_HOST: ${N8N_HOST:-localhost}
      N8N_PORT: 5678
      N8N_PROTOCOL: ${N8N_PROTOCOL:-http}
      WEBHOOK_URL: ${WEBHOOK_URL:-http://localhost:5678/}
      N8N_EDITOR_BASE_URL: ${N8N_EDITOR_BASE_URL:-http://localhost:5678/}

      N8N_SECURE_COOKIE: ${N8N_SECURE_COOKIE:-false}
      GENERIC_TIMEZONE: ${GENERIC_TIMEZONE:-Asia/Shanghai}
      TZ: ${GENERIC_TIMEZONE:-Asia/Shanghai}

      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_RUNNERS_ENABLED: ${N8N_RUNNERS_ENABLED:-true}
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: ${N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS:-true}

      HTTP_PROXY: ${HTTP_PROXY:-}
      HTTPS_PROXY: ${HTTPS_PROXY:-}
      ALL_PROXY: ${ALL_PROXY:-}
      NO_PROXY: ${NO_PROXY:-localhost,127.0.0.1,::1,host.docker.internal,n8n,postgres,redis,ollama}

    volumes:
      - n8n_data:/home/node/.n8n
      - ./files:/files

    healthcheck:
      test: ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:5678/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""]
      interval: 30s
      timeout: 10s
      retries: 10

volumes:
  n8n_data:
'@ | Set-Content -Encoding utf8 compose.yaml
```

---

### 3.5 启动

```bash
docker compose up -d
```

查看日志：

```bash
docker compose logs -f n8n
```

打开：

```text
http://localhost:5678
```

第一次进入会要求创建 Owner 账号。

---

### 3.6 停止、重启、升级

停止：

```bash
docker compose stop
```

启动：

```bash
docker compose start
```

重启：

```bash
docker compose restart
```

升级 n8n：

```bash
docker compose pull
docker compose up -d
```

> 不要随便执行 `docker compose down -v`。  
> `-v` 会删除 volume，可能导致 n8n 数据丢失。

---

### 3.7 界面中文化（可选）

n8n **官方没有中文版**，设置里也没有「语言切换」菜单，默认界面是英文。

如果你更习惯中文，可以用社区维护的汉化包 [n8n-i18n-chinese](https://github.com/other-blowsnow/n8n-i18n-chinese)。原理是：

1. 设置环境变量 `N8N_DEFAULT_LOCALE=zh-CN`
2. 用 Docker 卷把汉化后的 `editor-ui/dist` 挂载进容器，替换默认英文 UI 文件

> **版本必须对齐**：汉化包按 n8n 版本发布（例如 `release/2.25.7`）。n8n 升级后，汉化包也要换对应版本，否则可能出现页面空白或部分菜单乱码。

#### 3.7.1 确认当前 n8n 版本

```bash
docker exec n8n n8n --version
```

记下输出，例如 `2.25.7`，后面下载同版本的汉化包。

#### 3.7.2 下载并解压汉化包

在 `~/n8n-docker` 目录执行。

macOS / Linux：

```bash
cd ~/n8n-docker
mkdir -p editor-ui-dist

# 若 GitHub 下载慢或失败，先在当前终端设置代理（按你的本机代理端口修改）
# export HTTP_PROXY=http://127.0.0.1:7890
# export HTTPS_PROXY=http://127.0.0.1:7890

# 把 2.25.7 换成你实际的 n8n 版本号
curl -L -o editor-ui.tar.gz \
  "https://github.com/other-blowsnow/n8n-i18n-chinese/releases/download/release%2F2.25.7/editor-ui.tar.gz"

tar -xzf editor-ui.tar.gz -C editor-ui-dist --strip-components=1
```

Windows PowerShell：

```powershell
cd $HOME\n8n-docker
New-Item -ItemType Directory -Force -Path editor-ui-dist

# 把 2.25.7 换成你实际的 n8n 版本号
curl.exe -L -o editor-ui.tar.gz `
  "https://github.com/other-blowsnow/n8n-i18n-chinese/releases/download/release%2F2.25.7/editor-ui.tar.gz"

tar -xzf editor-ui.tar.gz -C editor-ui-dist --strip-components=1
```

解压成功后，`editor-ui-dist/` 里应能看到 `index.html`、`assets/`、`static/` 等目录。

> **不要挂载空目录或半拉子下载的文件**。如果 `editor-ui.tar.gz` 不完整（例如只有几百 KB，完整约 12MB），解压后界面可能直接白屏。

#### 3.7.3 修改 `.env`

在 `.env` 末尾增加：

```env
# 中文界面（需配合 compose.yaml 里的 editor-ui-dist 挂载）
N8N_DEFAULT_LOCALE=zh-CN
```

#### 3.7.4 修改 `compose.yaml`

在 `services.n8n.environment` 中增加：

```yaml
N8N_DEFAULT_LOCALE: ${N8N_DEFAULT_LOCALE:-zh-CN}
```

在 `services.n8n.volumes` 中增加一行挂载：

```yaml
- ./editor-ui-dist:/usr/local/lib/node_modules/n8n/node_modules/n8n-editor-ui/dist
```

完整示例（仅展示与汉化相关的增量部分）：

```yaml
    environment:
      # ... 其他已有环境变量 ...
      N8N_DEFAULT_LOCALE: ${N8N_DEFAULT_LOCALE:-zh-CN}

    volumes:
      - n8n_data:/home/node/.n8n
      - ./files:/files
      - ./editor-ui-dist:/usr/local/lib/node_modules/n8n/node_modules/n8n-editor-ui/dist
```

#### 3.7.5 重启 n8n

```bash
docker compose up -d
```

打开 http://localhost:5678 ，**强制刷新**（macOS：`Cmd + Shift + R`；Windows：`Ctrl + F5`），避免浏览器缓存旧英文资源。

#### 3.7.6 验证汉化是否生效

```bash
# 环境变量应为 zh-CN
docker exec n8n sh -lc 'echo $N8N_DEFAULT_LOCALE'

# 挂载目录里应有 assets
docker exec n8n sh -lc 'ls /usr/local/lib/node_modules/n8n/node_modules/n8n-editor-ui/dist/assets | head'
```

#### 3.7.7 汉化注意事项

| 事项 | 说明 |
|---|---|
| 汉化范围 | 主要是菜单、按钮、通用 UI；部分 AI 节点字段、第三方集成说明可能仍是英文 |
| n8n 升级 | 先 `docker compose pull` 升级 n8n，再下载**同版本**汉化包，重新解压到 `editor-ui-dist`，最后 `docker compose up -d` |
| 恢复英文 | 删除 `compose.yaml` 里的 `editor-ui-dist` 挂载行，去掉 `.env` 里的 `N8N_DEFAULT_LOCALE`，重启容器 |
| 页面白屏 | 通常是汉化包版本不匹配，或 `editor-ui-dist` 为空；先 `docker compose stop`，去掉挂载，再 `docker compose up -d` 恢复英文界面排查 |

---

## 4. 推荐方案 B：带 PostgreSQL 的长期使用版

如果你准备长期用 n8n，或者 workflow 越来越多，建议用 PostgreSQL。SQLite 可以跑，但长期稳定性、迁移、备份、并发方面 PostgreSQL 更合适。

### 4.1 `.env` 增加数据库配置

在 `.env` 末尾加入：

```env
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=change_this_to_a_long_password
```

---

### 4.2 PostgreSQL 版 `compose.yaml`

```yaml
name: n8n-postgres

services:
  postgres:
    image: postgres:16-alpine
    container_name: n8n-postgres
    restart: unless-stopped

    environment:
      POSTGRES_DB: ${POSTGRES_DB:-n8n}
      POSTGRES_USER: ${POSTGRES_USER:-n8n}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

    volumes:
      - postgres_data:/var/lib/postgresql/data

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-n8n} -d ${POSTGRES_DB:-n8n}"]
      interval: 10s
      timeout: 5s
      retries: 10

  n8n:
    image: ${N8N_IMAGE:-docker.n8n.io/n8nio/n8n:stable}
    container_name: n8n
    restart: unless-stopped

    depends_on:
      postgres:
        condition: service_healthy

    ports:
      - "127.0.0.1:${N8N_PORT:-5678}:5678"

    environment:
      N8N_HOST: ${N8N_HOST:-localhost}
      N8N_PORT: 5678
      N8N_PROTOCOL: ${N8N_PROTOCOL:-http}
      WEBHOOK_URL: ${WEBHOOK_URL:-http://localhost:5678/}
      N8N_EDITOR_BASE_URL: ${N8N_EDITOR_BASE_URL:-http://localhost:5678/}

      N8N_SECURE_COOKIE: ${N8N_SECURE_COOKIE:-false}
      GENERIC_TIMEZONE: ${GENERIC_TIMEZONE:-Asia/Shanghai}
      TZ: ${GENERIC_TIMEZONE:-Asia/Shanghai}

      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_RUNNERS_ENABLED: ${N8N_RUNNERS_ENABLED:-true}
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: ${N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS:-true}

      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: ${POSTGRES_DB:-n8n}
      DB_POSTGRESDB_USER: ${POSTGRES_USER:-n8n}
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}

      HTTP_PROXY: ${HTTP_PROXY:-}
      HTTPS_PROXY: ${HTTPS_PROXY:-}
      ALL_PROXY: ${ALL_PROXY:-}
      NO_PROXY: ${NO_PROXY:-localhost,127.0.0.1,::1,host.docker.internal,n8n,postgres,redis,ollama}

    volumes:
      - n8n_data:/home/node/.n8n
      - ./files:/files

volumes:
  n8n_data:
  postgres_data:
```

注意：

- `DB_POSTGRESDB_HOST` 要写 `postgres`，不是 `localhost`。
- 因为 postgres 和 n8n 在同一个 Compose 网络里，服务名就是可访问域名。
- 不要把数据库密码提交到公开仓库。

---

## 5. AI 大模型连通：必须先做容器内测试

### 5.1 最重要的判断

在宿主机上访问成功，不代表 n8n 容器访问成功。

你应该先跑：

```bash
docker exec -it n8n sh -lc "node -e \"fetch('https://api.openai.com/v1/models').then(r=>console.log('HTTP', r.status)).catch(e=>console.error(e.name, e.code, e.message))\""
```

可能结果：

| 结果 | 含义 |
|---|---|
| `HTTP 401` | 好事。说明容器已经能连到 OpenAI，只是没有带 API Key |
| `HTTP 200` | 网络和认证都可能正常，取决于你是否带了 key |
| `ENOTFOUND` | DNS 解析失败 |
| `ETIMEDOUT` / `ConnectTimeoutError` | 容器访问外网不通，通常是代理或网络阻断 |
| `ECONNRESET` | 连接被中间网络或代理重置，常见于代理、TLS、地区网络 |
| `certificate` / `self signed certificate` | TLS 证书被企业代理或中间证书拦截，需要加入自定义 CA |
| `ECONNREFUSED 127.0.0.1:xxxx` | 你请求了容器自己的 localhost，不是宿主机 |

只要这里不通，n8n UI 里配置 OpenAI / Claude / OpenRouter 基本都会失败。

---

## 6. 代理配置：最容易踩坑的部分

### 6.1 三种代理不是一回事

| 类型 | 作用对象 | 典型配置位置 |
|---|---|---|
| Docker Desktop 代理 | Docker Desktop 拉镜像、Docker 后端流量 | Docker Desktop Settings → Resources → Proxies |
| Docker CLI / 容器环境代理 | 新创建的容器自动带 `HTTP_PROXY` 等变量 | `~/.docker/config.json` 或 `docker run --env` |
| n8n 运行时代理 | n8n 节点请求 OpenAI / Claude 等 API | Compose 的 `environment` 里设置 `HTTP_PROXY` / `HTTPS_PROXY` |

**我的建议：**

- 镜像拉不下来：先配置 Docker Desktop 代理。
- n8n 容器里 AI 连不上：优先在 `compose.yaml` / `.env` 里配置 n8n 运行时代理。
- 不要只依赖系统代理，因为 n8n 容器不一定继承它。

---

### 6.2 如果你本机有代理端口，例如 `7890`

先在宿主机测试：

```bash
curl -I -x http://127.0.0.1:7890 https://api.openai.com/v1/models
```

如果返回 `401`，说明代理能访问 OpenAI API。

然后测试容器能否访问宿主机代理：

```bash
docker run --rm curlimages/curl:8.10.1 -I \
  -x http://host.docker.internal:7890 \
  https://api.openai.com/v1/models
```

如果这里返回 `401`，说明 Docker 容器能通过宿主机代理访问 OpenAI。

---

### 6.3 在 `.env` 中启用代理

把 `.env` 里的代理改成：

```env
HTTP_PROXY=http://host.docker.internal:7890
HTTPS_PROXY=http://host.docker.internal:7890
ALL_PROXY=
NO_PROXY=localhost,127.0.0.1,::1,host.docker.internal,n8n,postgres,redis,ollama
```

然后重启：

```bash
docker compose up -d
docker compose logs -f n8n
```

再测试：

```bash
docker exec -it n8n sh -lc "env | grep -i proxy"
docker exec -it n8n sh -lc "node -e \"fetch('https://api.openai.com/v1/models').then(r=>console.log('HTTP', r.status)).catch(e=>console.error(e.name, e.code, e.message))\""
```

能返回 `HTTP 401` 就说明网络层基本 OK。

---

### 6.4 为什么 `HTTPS_PROXY` 经常也是 `http://...`

本地代理软件常见提供的是 HTTP CONNECT 代理，虽然它代理的是 HTTPS 请求，但代理地址本身通常是：

```env
HTTPS_PROXY=http://host.docker.internal:7890
```

不要机械写成：

```env
HTTPS_PROXY=https://host.docker.internal:7890
```

除非你的代理端口明确支持 HTTPS proxy 协议。

---

### 6.5 小写代理变量优先级

n8n 使用的代理读取逻辑里，小写变量如 `http_proxy` 的优先级可能高于大写变量 `HTTP_PROXY`。所以如果你同时设置了：

```env
HTTP_PROXY=http://host.docker.internal:7890
http_proxy=http://wrong-proxy:7890
```

n8n 可能实际走小写的那个错误代理。

排查时执行：

```bash
docker exec -it n8n sh -lc "env | grep -i proxy"
```

如果大小写都存在，建议统一清理，只保留你确定正确的一套。

---

### 6.6 `NO_PROXY` 很重要

如果你用了代理，又要访问本地服务、PostgreSQL、Ollama、Redis，必须让这些地址不要走代理：

```env
NO_PROXY=localhost,127.0.0.1,::1,host.docker.internal,n8n,postgres,redis,ollama
```

否则会出现很奇怪的现象：

- n8n 访问外部 API 正常；
- 但访问本地 Ollama / Postgres / Redis / 内网服务反而失败。

---

## 7. Docker Desktop 的 `host.docker.internal`

当 n8n 在容器里运行时：

```text
localhost
```

指的是 **n8n 容器自己**。

如果你要访问电脑宿主机上的服务，例如：

- 本机代理：`127.0.0.1:7890`
- Ollama：`127.0.0.1:11434`
- LM Studio：`127.0.0.1:1234`
- 自己写的 API：`127.0.0.1:8000`

在 n8n 容器里应该写：

```text
host.docker.internal
```

例如：

```text
http://host.docker.internal:7890
http://host.docker.internal:11434
http://host.docker.internal:1234
http://host.docker.internal:8000
```

---

## 8. 本地模型 / Ollama / LM Studio 的正确写法

### 8.1 Ollama 跑在宿主机

如果 Ollama 是你电脑本机安装的，n8n 里 Base URL 写：

```text
http://host.docker.internal:11434
```

不要写：

```text
http://localhost:11434
```

因为容器内 `localhost` 是 n8n 容器自己。

---

### 8.2 Ollama 和 n8n 在同一个 Compose 里

如果你把 Ollama 也作为服务加入 Compose：

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "127.0.0.1:11434:11434"

  n8n:
    # ...
```

那么 n8n 里 Base URL 应该写：

```text
http://ollama:11434
```

不是 `localhost`。

---

### 8.3 `ECONNREFUSED ::1:11434`

这个错误通常和 IPv6 解析有关，`localhost` 被解析成了 `::1`，但服务只监听 IPv4。

处理方式：

- 本机直接测试时，用 `127.0.0.1` 替代 `localhost`。
- n8n 容器访问宿主机 Ollama 时，用 `host.docker.internal`。
- 同一个 Compose 网络里访问 Ollama 时，用服务名 `ollama`。

---

## 9. n8n 里配置 OpenAI / Claude / OpenRouter 的顺序

### 9.1 先验证网络，不要先怀疑模型名

先跑：

```bash
docker exec -it n8n sh -lc "node -e \"fetch('https://api.openai.com/v1/models').then(r=>console.log('HTTP', r.status)).catch(e=>console.error(e.name, e.code, e.message))\""
```

如果能返回 `401`，再进入 n8n 配置 credentials。

---

### 9.2 OpenAI

n8n UI：

```text
Credentials → OpenAI → API Key
```

常见 Base URL：

```text
https://api.openai.com/v1
```

如果你用的是中转 API，就填中转商给你的 OpenAI-compatible Base URL，例如：

```text
https://xxx.example.com/v1
```

注意：

- API Key 不要多复制空格。
- 如果账号属于多个 organization / project，确认 key 对应的组织和项目。
- 401 通常是 key 错。
- 429 通常是限流或额度问题。
- `insufficient_quota` 通常是余额、限额或账户额度问题。

---

### 9.3 Claude / Anthropic

n8n UI：

```text
Credentials → Anthropic → API Key
```

如果网络层没有走通，Claude 节点也一样会 timeout。先用同样方法测试：

```bash
docker exec -it n8n sh -lc "node -e \"fetch('https://api.anthropic.com').then(r=>console.log('HTTP', r.status)).catch(e=>console.error(e.name, e.code, e.message))\""
```

---

### 9.4 OpenRouter / 其他 OpenAI-compatible API

一般遵循：

```text
Base URL = 服务商给你的 /v1 结尾地址
API Key = 服务商控制台生成的 key
```

如果服务商要求特殊 header，在 n8n 的 HTTP Request 节点或对应 credentials 中配置。

---

## 10. Webhook、OAuth、回调为什么会失败

如果你只是本地玩 AI 节点，`WEBHOOK_URL=http://localhost:5678/` 通常够用。

但如果你要接：

- Telegram Trigger
- Stripe Webhook
- Google OAuth
- Slack OAuth
- WhatsApp / Meta Webhook
- 外部系统回调
- MCP / Webhook Trigger

那本地 `localhost` 对外部服务不可见。

### 10.1 本地临时测试

可以用隧道工具，例如：

```text
https://xxxx.ngrok-free.app
```

此时 `.env` 要改：

```env
N8N_HOST=xxxx.ngrok-free.app
N8N_PROTOCOL=https
WEBHOOK_URL=https://xxxx.ngrok-free.app/
N8N_EDITOR_BASE_URL=https://xxxx.ngrok-free.app/
N8N_SECURE_COOKIE=true
```

然后：

```bash
docker compose up -d
```

---

### 10.2 公网域名部署

如果你有域名：

```env
N8N_HOST=n8n.example.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.example.com/
N8N_EDITOR_BASE_URL=https://n8n.example.com/
N8N_SECURE_COOKIE=true
N8N_PROXY_HOPS=1
```

并且用 Nginx / Caddy / Traefik 做 HTTPS 反向代理。

反向代理要传递：

```text
X-Forwarded-For
X-Forwarded-Host
X-Forwarded-Proto
```

---

## 11. 公网部署时不要这样暴露端口

不要在公网服务器上随便写：

```yaml
ports:
  - "5678:5678"
```

这会把 n8n 暴露到所有网络接口上。

更安全的做法：

```yaml
ports:
  - "127.0.0.1:5678:5678"
```

然后用反向代理访问，或者用 SSH tunnel：

```bash
ssh -L 5678:127.0.0.1:5678 user@your-server-ip
```

浏览器打开：

```text
http://localhost:5678
```

---

## 12. 常见错误与处理表

| 错误/现象 | 最可能原因 | 处理方式 |
|---|---|---|
| n8n 页面打不开 | 容器未启动 / 端口占用 | `docker compose logs -f n8n`；换端口 |
| 登录后循环跳转 | 本地 HTTP 但 secure cookie 开着 | `N8N_SECURE_COOKIE=false` |
| `getaddrinfo ENOTFOUND api.openai.com` | DNS 解析失败 | 检查 Docker DNS；尝试设置 `dns`；检查代理 |
| `ETIMEDOUT` | 容器出站网络不通 | 设置 `HTTPS_PROXY`；确认容器能访问代理 |
| `ECONNRESET` | 代理或 TLS 被重置 | 换代理线路；检查证书；检查中间网络 |
| `self signed certificate` | 企业代理或中间证书 | 挂载自定义 CA 到 `/opt/custom-certificates` |
| `ECONNREFUSED localhost:11434` | 容器访问自己而不是宿主机 | 改成 `host.docker.internal:11434` |
| `ECONNREFUSED ::1:11434` | IPv6 localhost 问题 | 改用 `127.0.0.1` 或服务名 |
| OpenAI `401` | API Key 错误 | 重新生成 key；检查组织/项目 |
| OpenAI `429` | 速率限制或额度 | 降低并发；加重试；检查限额 |
| `insufficient_quota` | 余额、试用额度、项目限额问题 | 检查 billing / usage limits |
| n8n 里模型列表加载不出来 | credentials 或网络问题 | 先做容器内 `fetch` 测试 |
| Webhook URL 显示 localhost | `WEBHOOK_URL` 没设公网地址 | 设置 `WEBHOOK_URL` |
| Google / Slack OAuth 回调失败 | `N8N_EDITOR_BASE_URL` / `WEBHOOK_URL` 不匹配 | 改成完整 HTTPS 域名 |
| Windows 下权限报错 | bind mount 权限不符合 n8n 严格要求 | 用 named volume；或设 `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false` |
| 界面仍是英文 | 未挂载汉化包 / 浏览器缓存 | 按 [3.7](#37-界面中文化可选) 配置；强制刷新或无痕窗口 |
| 启用汉化后页面白屏 | 汉化包版本与 n8n 不匹配 / 挂载空目录 | 去掉 `editor-ui-dist` 挂载恢复英文；下载对应版本完整汉化包 |

---

## 13. 容器网络诊断命令

### 13.1 查看容器状态

```bash
docker compose ps
```

### 13.2 查看日志

```bash
docker compose logs -f n8n
```

### 13.3 查看环境变量

```bash
docker exec -it n8n sh -lc "env | sort"
```

只看代理：

```bash
docker exec -it n8n sh -lc "env | grep -i proxy"
```

### 13.4 测试 DNS

```bash
docker exec -it n8n sh -lc "node -e \"require('dns').lookup('api.openai.com', (e,a,f)=>console.log(e || {address:a,family:f}))\""
```

### 13.5 测试 HTTPS

```bash
docker exec -it n8n sh -lc "node -e \"fetch('https://api.openai.com/v1/models').then(r=>console.log('HTTP', r.status)).catch(e=>console.error(e.name, e.code, e.message))\""
```

### 13.6 测试本机代理

```bash
docker run --rm curlimages/curl:8.10.1 -I \
  -x http://host.docker.internal:7890 \
  https://api.openai.com/v1/models
```

### 13.7 查看端口占用

macOS / Linux：

```bash
lsof -i :5678
```

Windows PowerShell：

```powershell
netstat -ano | findstr :5678
```

---

## 14. 如果需要自定义 DNS

一般不要一开始就加 DNS。只有出现 `ENOTFOUND` 或 DNS 污染/解析异常时再试。

在 `compose.yaml` 的 `n8n` 服务下加入：

```yaml
    dns:
      - 1.1.1.1
      - 8.8.8.8
```

然后：

```bash
docker compose up -d
```

注意：

- 公司内网或局域网服务可能需要内网 DNS。
- 盲目改成公共 DNS，可能导致内网域名解析失败。

---

## 15. 如果出现证书错误

如果日志里看到：

```text
self signed certificate
unable to verify the first certificate
certificate has expired
```

不要直接关闭 SSL 校验。更稳妥的方式是给 n8n 添加自定义 CA。

### 15.1 准备证书目录

```bash
mkdir -p pki
```

把 `.crt` / `.pem` / `.cer` 放进去。

### 15.2 Compose 挂载

```yaml
volumes:
  - n8n_data:/home/node/.n8n
  - ./files:/files
  - ./pki:/opt/custom-certificates
```

启动后修权限：

```bash
docker exec --user 0 n8n chown -R 1000:1000 /opt/custom-certificates
docker compose restart n8n
```

---

## 16. 生产部署建议

如果你只是本地测试，方案 A 够用。

如果你准备正式用：

### 16.1 推荐结构

```text
Internet
  ↓
Cloudflare / DNS
  ↓
Nginx / Caddy / Traefik HTTPS Reverse Proxy
  ↓
n8n container
  ↓
PostgreSQL
```

### 16.2 生产环境 `.env` 示例

```env
N8N_HOST=n8n.example.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.example.com/
N8N_EDITOR_BASE_URL=https://n8n.example.com/
N8N_SECURE_COOKIE=true
N8N_PROXY_HOPS=1
GENERIC_TIMEZONE=Asia/Shanghai
N8N_ENCRYPTION_KEY=your_fixed_random_key
```

### 16.3 生产环境不要做的事

不要：

- 把 `N8N_SECURE_COOKIE=false` 用在公网 HTTPS。
- 用 `ports: "5678:5678"` 直接暴露 n8n。
- 把 API Key 写进公开仓库。
- 随便删除 Docker volume。
- 没备份就升级大版本。
- 所有请求都走代理但不配置 `NO_PROXY`。

---

## 17. 备份与恢复

### 17.1 SQLite / named volume 备份

```bash
docker compose stop n8n

docker run --rm \
  -v n8n-local_n8n_data:/data \
  -v "$PWD:/backup" \
  alpine \
  tar czf /backup/n8n_data_backup.tgz -C /data .

docker compose start n8n
```

> 注意 volume 名可能不是 `n8n-local_n8n_data`。  
> 用这个命令查看真实 volume 名：

```bash
docker volume ls | grep n8n
```

### 17.2 PostgreSQL 备份

```bash
docker exec -t n8n-postgres pg_dump -U n8n n8n > n8n_postgres_backup.sql
```

恢复前先停止 n8n，并确保目标数据库为空或你知道自己在覆盖什么。

---

## 18. 一套最小排错流程

遇到大模型连不上，按这个顺序排，不要跳：

### Step 1：确认 n8n 容器正常

```bash
docker compose ps
docker compose logs -f n8n
```

### Step 2：确认 n8n 容器里有代理变量

```bash
docker exec -it n8n sh -lc "env | grep -i proxy"
```

### Step 3：确认 DNS

```bash
docker exec -it n8n sh -lc "node -e \"require('dns').lookup('api.openai.com', (e,a,f)=>console.log(e || {address:a,family:f}))\""
```

### Step 4：确认 HTTPS 出站

```bash
docker exec -it n8n sh -lc "node -e \"fetch('https://api.openai.com/v1/models').then(r=>console.log('HTTP', r.status)).catch(e=>console.error(e.name, e.code, e.message))\""
```

### Step 5：看返回

- `HTTP 401`：网络 OK，去看 API Key。
- `ENOTFOUND`：DNS。
- `ETIMEDOUT`：代理 / 出站网络。
- `ECONNRESET`：代理线路 / TLS / 网络拦截。
- `certificate`：证书。
- `ECONNREFUSED localhost`：Base URL 写错，改 host.docker.internal 或服务名。

### Step 6：再去 n8n UI 配 credentials

只有网络层确认后，才进入：

```text
Credentials → OpenAI / Anthropic / OpenRouter / Ollama
```

---

## 19. 推荐你最终保留的文件结构

```text
n8n-docker/
├── .env
├── compose.yaml
├── files/
├── editor-ui-dist/      # 可选，社区中文汉化 UI（见 3.7）
├── editor-ui.tar.gz     # 可选，汉化包下载缓存，可删
├── pki/                 # 可选，放自定义 CA
└── backups/             # 可选，放备份
```

不要把 `.env` 发给别人，因为里面可能包含代理地址、数据库密码、加密 key。

---

## 20. 我对你这个场景的实际建议

你的描述是：

> 下载 Docker App，然后通过命令行安装 n8n；部署后大模型连不上；怀疑代理或其他原因。

我的判断是：

1. **先用本地方案 A 跑通 n8n**，不要一开始就搞域名、HTTPS、PostgreSQL、worker、queue。
2. **如果你所在网络访问 OpenAI/Claude 不稳定，必须显式配置容器代理**，不要以为电脑开了代理 Docker 就自动能用。
3. **用容器内 Node `fetch` 测试作为唯一判断标准**，不要用浏览器、不要用宿主机 curl 代替。
4. **本地 Ollama / LM Studio / 自建 API 统一使用 `host.docker.internal`**。
5. **等 AI 节点跑通后，再考虑公网 webhook 和 HTTPS**。顺序反过来会非常容易把问题混在一起。
6. **界面看不懂英文时**，先按 [3.7](#37-界面中文化可选) 做社区汉化，不要因此跳过 n8n 本身的网络与 AI 节点排错。

---

## 21. 参考资料

以下资料用于核对本教程中的关键配置与排错逻辑：

1. n8n Docker Installation  
   https://docs.n8n.io/hosting/installation/docker/

2. n8n Docker Compose setup  
   https://docs.n8n.io/hosting/installation/server-setups/docker-compose/

3. n8n Deployment environment variables  
   https://docs.n8n.io/hosting/configuration/environment-variables/deployment/

4. n8n custom encryption key  
   https://docs.n8n.io/hosting/configuration/configuration-examples/encryption-key/

5. n8n reverse proxy webhook URL  
   https://docs.n8n.io/hosting/configuration/configuration-examples/webhook-url/

6. n8n Database environment variables  
   https://docs.n8n.io/hosting/configuration/environment-variables/database/

7. n8n Security environment variables  
   https://docs.n8n.io/hosting/configuration/environment-variables/security/

8. n8n custom certificate authority  
   https://docs.n8n.io/hosting/configuration/configuration-examples/custom-certificate-authority/

9. n8n OpenAI credentials  
   https://docs.n8n.io/integrations/builtin/credentials/openai/

10. n8n OpenAI node common issues  
    https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/common-issues/

11. n8n OpenAI Chat Model node  
    https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/

12. n8n Ollama common issues  
    https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmollama/common-issues/

13. n8n Self-hosted AI Starter Kit  
    https://docs.n8n.io/hosting/starter-kits/ai-starter-kit/

14. Docker Desktop networking how-tos  
    https://docs.docker.com/desktop/features/networking/networking-how-tos/

15. Docker Desktop networking overview  
    https://docs.docker.com/desktop/features/networking/

16. Docker CLI proxy configuration  
    https://docs.docker.com/engine/cli/proxy/

17. Docker Compose service reference  
    https://docs.docker.com/reference/compose-file/services/

18. OpenAI incorrect API key troubleshooting  
    https://help.openai.com/en/articles/6882433-incorrect-api-key-provided

19. OpenAI 429 rate limit troubleshooting  
    https://help.openai.com/en/articles/5955604-how-can-i-solve-429-too-many-requests-errors

20. OpenAI API errors and latency troubleshooting  
    https://help.openai.com/en/articles/1000499-troubleshooting-api-errors-and-latency

21. OpenAI API key safety  
    https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety

22. n8n timezone and localization environment variables  
    https://docs.n8n.io/hosting/configuration/environment-variables/timezone-localization/

23. n8n-i18n-chinese（社区中文汉化包，按 n8n 版本发布）  
    https://github.com/other-blowsnow/n8n-i18n-chinese
