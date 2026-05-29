# 线上发布：Netlify 部署、域名解析与环境变量安全防线

当我们在本地完成了 React 个人网站的微调，接下来就是最激动人心的时刻了——**将网站发布到互联网，绑定自己的个性域名（如 `zlcggb.com`），并配置好环境变量以保障敏感数据的安全**。

---

## 一、 极速上云：为什么选择 Netlify？

**Netlify** 是目前全球最受欢迎的静态网页托管平台之一，尤其适合托管 React、Vue 等 SPA（单页应用）网站。
它最强悍的地方在于：**持续集成 (CI/CD)**。你只需要把 Netlify 与你的 GitHub 仓库绑定，以后每当你在本地执行 `git push` 时，Netlify 就会自动拉取代码并在一分钟内重新编译部署，完全不需要你手动上传文件。

### 部署 3 步法：
1.  登录 [Netlify 官网](https://app.netlify.com/)，注册一个账号。
2.  点击 **Add new site**，选择 **Import an existing project**，然后授权关联你的 GitHub。
3.  选择你的个人网站代码仓库，Netlify 会自动识别出构建参数（通常为 `npm run build` 和输出目录 `dist`），点击 **Deploy** 即可开始部署。

---

## 二、 品牌升华：绑定个性化域名与 DNS 配置

Netlify 默认会分配一个诸如 `fancy-capybara-12345.netlify.app` 的随机域名。要换成我们高大上的个人域名 `zlcggb.com`，需要进行域名解析设置。

```
                    +--------------------+
                    |  你的个性化域名     |
                    |   (zlcggb.com)     |
                    +--------------------+
                              |
                     (DNS 别名解析 CNAME)
                              v
                    +--------------------+
                    |  Netlify 分配域名   |
                    | (xxx.netlify.app)  |
                    +--------------------+
```

### 1. 在 Netlify 添加自定义域名
在你的 Site settings 中找到 **Domain management**，点击 **Add custom domain**，输入你买好的域名（例如 `zlcggb.com`）。

### 2. 去域名服务商（如阿里云/腾讯云）配置 DNS
1.  登录你购买域名的管理后台，找到 **DNS 解析设置**。
2.  添加两条关键的解析记录：
    *   **CNAME 记录**：
        *   主机记录 (Host)：`www`
        *   记录类型 (Type)：`CNAME`
        *   记录值 (Value)：填写 Netlify 分配给你的临时域名，例如 `xxx.netlify.app`。
    *   **A 记录 / 别名解析（针对不带 www 的顶级域名 `zlcggb.com`）**：
        *   通常在解析后台，主机记录填 `@`，记录类型选 `CNAME`（如果支持）指向 Netlify，或者指向 Netlify 提供的特定 IP 地址（具体可见 Netlify 域名面板提示）。
3.  **配置 SSL 证书**：解析生效后，Netlify 会自动为你免费申请并续签 **Let's Encrypt** 的 HTTPS 加密证书，锁住你的小锁图标。

---

## 三、 绝对防线：利用环境变量（.env）保护敏感密钥

在个人网站中，我们往往会接入数据库（比如 Supabase）或大模型 API 密钥。
**这些密钥是绝对不能直接写在代码里并推送到 GitHub 公开仓库的！** 否则，一旦被机器人扫描到，可能会产生天价的账单。

### 1. 什么是 `.env` 环境变量？
`.env` 是专门用来存储私密和配置信息的文件格式。
例如，在本地项目根目录下创建 `.env.local` 文件：
```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
在 React 代码中，我们可以通过以下方式动态读取：
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 2. 忽略上传 `.env` 配置文件
为了确保本地密码安全，必须在 `.gitignore` 文件中追加下面这一行，强制 Git 忽略它，绝不上传到云端：
```gitignore
.env
.env.local
.env.development.local
.env.production.local
```

### 3. 在 Netlify 线上配置环境变量
既然 Git 仓库里没有 `.env` 文件，线上构建时如何获取数据库密钥呢？
1.  进入 Netlify 对应网站的 Site settings，点击 **Environment variables**。
2.  点击 **Add a variable**，将你的变量名（如 `VITE_SUPABASE_URL`）和值填入其中。
3.  当 Netlify 启动编译时，会自动将这些云端环境变量注入到打包流程中，既保证了线上网站的正常运行，又维护了 GitHub 代码库的彻底开源纯净。

---

## 四、 本章总结与后续计划

至此，你已经完成了从“产品思路脑暴”、“原型极速搭建”、“本地环境二次开发”，直到“生产环境 Netlify 部署、域名绑定和数据加密”的全部网站开发主干流程。

在接下来的课程中，我们将更深入地进入高阶领域：
*   网络加速与代理节点的优化选型；
*   基于 Supabase 快速开通后台用户登录、阅读量计数与评论系统；
*   使用 Google IDE 插件进行更高效的 AI 结对编程。
线上见！
