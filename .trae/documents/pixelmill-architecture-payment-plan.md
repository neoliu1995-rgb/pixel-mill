# PixelMill 网站架构全面梳理与支付系统完善方案

---

## 一、技术架构总览

### 1.1 核心技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Next.js (App Router) | 15.1 | 全栈React框架，SSR/SSG |
| UI库 | React | 18.3 | 组件化UI构建 |
| 语言 | TypeScript | 5.7 | 类型安全 |
| 样式 | Tailwind CSS | 3.4 | 原子化CSS |
| 数据库 | SQLite | - | 轻量级关系数据库 |
| ORM | Prisma | 5.22 | 数据库访问层 |
| 认证 | NextAuth.js | 4.24 | 身份认证（JWT策略） |
| 密码加密 | bcryptjs | 3.0 | 密码哈希 |
| Token | jsonwebtoken | 9.0 | JWT令牌生成/验证 |
| 支付 | Stripe | 22.1 | 订阅支付处理 |
| 图像处理 | Sharp | - | 水印添加、服务端图像处理 |
| 图标 | Lucide React | 0.468 | UI图标库 |
| 广告 | Google AdSense | - | 广告变现 |
| 工具 | clsx + tailwind-merge | - | 样式合并工具 |

### 1.2 项目结构

```
src/
├── app/                          # Next.js App Router 页面
│   ├── api/                      # API路由层
│   │   ├── auth/                 # 认证（NextAuth + 登录/注册）
│   │   ├── checkout/             # Stripe结账
│   │   ├── generate/             # AI图像生成
│   │   ├── copywriting/          # AI文案生成
│   │   ├── remove-background/    # 抠图
│   │   ├── white-background/     # 白底图
│   │   ├── upscale/              # 图像超分
│   │   ├── poster/               # 海报生成
│   │   ├── detail-page/          # 详情页生成
│   │   ├── subscription/         # 订阅管理
│   │   ├── webhook/              # Stripe Webhook
│   │   └── user/                 # 用户管理
│   ├── background-remover/       # 抠图页面
│   ├── copywriting/              # 文案页面
│   ├── ecommerce/                # 电商工具页面
│   ├── effects/                  # 特效页面
│   ├── gallery/                  # 灵感画廊
│   ├── pricing/                  # 定价页面
│   ├── dashboard/                # 用户仪表板
│   └── auth/                     # 认证页面
├── components/                   # 组件层
│   ├── ads/                      # AdSense广告组件
│   ├── auth/                     # 认证Provider
│   ├── ecommerce/                # 电商工具组件
│   ├── effects/                  # 特效组件
│   ├── gallery/                  # 画廊组件
│   ├── generator/                # 图像生成器组件
│   ├── layout/                   # 布局组件
│   ├── payments/                 # 支付组件
│   ├── social/                   # 社交证明组件
│   └── ui/                       # 通用UI组件
└── lib/                          # 核心逻辑层
    ├── providers/                # AI模型Provider层
    │   ├── base.ts               # Provider接口定义
    │   ├── router.ts             # 模型路由/调度
    │   ├── siliconflow.ts        # SiliconFlow Provider
    │   ├── alibailian.ts         # 阿里百炼 Provider
    │   ├── alibailian-edit.ts    # 阿里百炼图像编辑 Provider
    │   └── gemini.ts             # Google Gemini Provider
    ├── imageGenerator.ts         # 图像生成入口
    ├── promptEnhancer.ts         # 提示词增强引擎
    ├── quota.ts                  # 配额管理
    ├── stripe.ts                 # Stripe配置与套餐定义
    ├── watermark.ts              # 水印处理
    ├── upscale.ts                # 客户端超分
    ├── upscale-server.ts         # 服务端超分
    ├── i18n.ts                   # 国际化
    └── prisma.ts                 # Prisma客户端
```

### 1.3 数据模型

```
User ──1:1──> Subscription
User ──1:N──> ApiKey
User ──1:N──> GenerationHistory

Subscription: id, userId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodEnd, trialEnd
ApiKey: id, userId, key, name
GenerationHistory: id, userId, prompt, model, imageUrl, createdAt
```

---

## 二、AI模型集成详情

### 2.1 图像生成模型

#### (1) Pollinations — FLUX.1 Schnell

| 属性 | 详情 |
|------|------|
| **模型名称** | FLUX.1 Schnell |
| **模型ID** | `flux-schnell` |
| **提供商** | Pollinations AI |
| **API地址** | `https://image.pollinations.ai/prompt/` |
| **应用场景** | 免费用户默认模型、快速出图、概念验证、所有Provider失败后的最终回退 |
| **收费状态** | **完全免费** |
| **免费额度** | 无限制（无调用次数限制） |
| **超出额度计费** | 不适用（完全免费） |
| **支持图生图** | ✅ |
| **支持中文** | ❌ |
| **质量评分** | 2/5 |
| **速度评分** | 4/5 |

#### (2) SiliconFlow — FLUX.2 Pro

| 属性 | 详情 |
|------|------|
| **模型名称** | FLUX.2 Pro |
| **模型ID** | `black-forest-labs/FLUX.2-pro` |
| **提供商** | SiliconFlow（硅基流动） |
| **API地址** | `https://api.siliconflow.cn/v1/images/generations` |
| **应用场景** | 专业版用户高质量出图、专业设计、细节丰富的图像生成、图生图场景 |
| **收费状态** | **付费** |
| **单价** | $0.03/张 |
| **免费额度** | SiliconFlow平台注册赠送少量额度（约14元人民币），用完后按量计费 |
| **超出额度计费** | 按张计费，$0.03/张 |
| **支持图生图** | ❌（代码中图生图场景强制使用此模型，但模型本身不原生支持） |
| **支持中文** | ❌ |
| **质量评分** | 5/5 |
| **速度评分** | 3/5 |

#### (3) SiliconFlow — FLUX.2 Flex

| 属性 | 详情 |
|------|------|
| **模型名称** | FLUX.2 Flex |
| **模型ID** | `black-forest-labs/FLUX.2-flex` |
| **提供商** | SiliconFlow（硅基流动） |
| **API地址** | `https://api.siliconflow.cn/v1/images/generations` |
| **应用场景** | 企业版用户灵活创作、商业用途、高自由度图像生成 |
| **收费状态** | **付费** |
| **单价** | $0.06/张 |
| **免费额度** | 同SiliconFlow平台注册赠送额度 |
| **超出额度计费** | 按张计费，$0.06/张 |
| **支持图生图** | ❌ |
| **支持中文** | ❌ |
| **质量评分** | 4/5 |
| **速度评分** | 4/5 |

#### (4) SiliconFlow — Z-Image Turbo

| 属性 | 详情 |
|------|------|
| **模型名称** | Z-Image Turbo（知乎AI图像） |
| **模型ID** | `Zhihu-ai/Z-Image-Turbo` |
| **提供商** | SiliconFlow（硅基流动） |
| **API地址** | `https://api.siliconflow.cn/v1/images/generations` |
| **应用场景** | 免费用户快速出图、概念验证、中文提示词场景 |
| **收费状态** | **部分免费** |
| **单价** | $0.005/张 |
| **免费额度** | SiliconFlow平台注册赠送额度可覆盖大量调用 |
| **超出额度计费** | 按张计费，$0.005/张 |
| **支持图生图** | ❌ |
| **支持中文** | ✅ |
| **质量评分** | 2/5 |
| **速度评分** | 5/5 |

#### (5) 阿里百炼 — 通义万相 2.6

| 属性 | 详情 |
|------|------|
| **模型名称** | 通义万相 2.6 |
| **模型ID** | `wanx2.6-t2i` |
| **提供商** | 阿里百炼（DashScope） |
| **API地址** | `https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis` |
| **应用场景** | 专业版用户电商主图、创意设计、中文提示词高质量出图 |
| **收费状态** | **付费** |
| **单价** | ¥0.20/张 |
| **免费额度** | 阿里百炼新用户赠送100万Token免费额度（约5000张图） |
| **超出额度计费** | 按张计费，¥0.20/张 |
| **支持图生图** | ❌ |
| **支持中文** | ✅ |
| **质量评分** | 5/5 |
| **速度评分** | 3/5 |
| **调用方式** | 异步任务（提交→轮询→获取结果） |

#### (6) 阿里百炼 — 通义万相 2.1 Turbo

| 属性 | 详情 |
|------|------|
| **模型名称** | 通义万相 2.1 Turbo |
| **模型ID** | `wanx2.1-t2i-turbo` |
| **提供商** | 阿里百炼（DashScope） |
| **API地址** | `https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis` |
| **应用场景** | 免费用户快速出图、概念验证、中文提示词 |
| **收费状态** | **部分免费** |
| **单价** | ¥0.04/张 |
| **免费额度** | 阿里百炼新用户赠送额度可覆盖 |
| **超出额度计费** | 按张计费，¥0.04/张 |
| **支持图生图** | ❌ |
| **支持中文** | ✅ |
| **质量评分** | 3/5 |
| **速度评分** | 5/5 |

#### (7) Google Gemini — Gemini 2.5 Flash Image

| 属性 | 详情 |
|------|------|
| **模型名称** | Gemini 2.5 Flash Image |
| **模型ID** | `gemini-2.5-flash-image` |
| **实际API模型** | `gemini-2.5-flash-preview-image-generation` |
| **提供商** | Google AI |
| **API地址** | `https://generativelanguage.googleapis.com/v1beta/models/` |
| **应用场景** | 免费用户默认出图、图生图、中文提示词 |
| **收费状态** | **部分免费** |
| **免费额度** | 免费层15 RPM（每分钟请求数），1,500 RPD（每日请求数） |
| **超出额度计费** | 按Token计费，输入$0.15/百万Token，输出$0.60/百万Token（图片输出$3.50/百万Token） |
| **支持图生图** | ✅ |
| **支持中文** | ✅ |
| **质量评分** | 4/5 |
| **速度评分** | 4/5 |

#### (8) Google Gemini — Imagen 4 Fast

| 属性 | 详情 |
|------|------|
| **模型名称** | Imagen 4 Fast |
| **模型ID** | `imagen-4-fast` |
| **实际API模型** | `imagen-4.0-generate-001` |
| **提供商** | Google AI |
| **API地址** | `https://generativelanguage.googleapis.com/v1beta/models/` |
| **应用场景** | 专业版用户高质量出图、快速生成、中文提示词 |
| **收费状态** | **付费** |
| **单价** | $0.02/张（代码中设定） |
| **免费额度** | Google AI Studio有少量免费试用额度 |
| **超出额度计费** | 按张计费，$0.02/张 |
| **支持图生图** | ❌ |
| **支持中文** | ✅ |
| **质量评分** | 4/5 |
| **速度评分** | 5/5 |

> ⚠️ **注意**：当前代码中 `GeminiImageProvider.generate()` 方法硬编码使用 `gemini-2.5-flash-image`，Imagen 4 Fast 虽然在模型列表中定义但实际未被调用。

### 2.2 图像编辑模型

#### (9) 阿里百炼 — wanx2.1-imageedit

| 属性 | 详情 |
|------|------|
| **模型名称** | 通义万相图像编辑 |
| **模型ID** | `wanx2.1-imageedit` |
| **提供商** | 阿里百炼（DashScope） |
| **API地址** | `https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis` |
| **应用场景** | 抠图（去除背景）、换背景（白底图）、图像超分 |
| **收费状态** | **付费** |
| **单价** | ¥0.14/张 |
| **免费额度** | 阿里百炼新用户赠送额度可覆盖 |
| **超出额度计费** | 按张计费，¥0.14/张 |
| **调用方式** | 异步任务（提交→轮询→获取结果） |

#### (10) Remove.bg

| 属性 | 详情 |
|------|------|
| **模型名称** | Remove.bg API |
| **提供商** | Kaleido AI |
| **API地址** | `https://api.remove.bg/v1.0/removebg` |
| **应用场景** | 抠图（首选）、白底图（首选，支持bg_color和add_shadow参数） |
| **收费状态** | **部分免费** |
| **免费额度** | 免费层1张/月（极低），预览质量（最大0.25百万像素） |
| **超出额度计费** | 订阅制：$9/月（40张）、$29/月（200张）、$79/月（800张）、$199/月（3000张） |
| **优先级** | 高于阿里百炼（作为首选Provider） |

### 2.3 文本生成模型

#### (11) SiliconFlow — DeepSeek-V3

| 属性 | 详情 |
|------|------|
| **模型名称** | DeepSeek-V3 |
| **模型ID** | `deepseek-ai/DeepSeek-V3` |
| **提供商** | SiliconFlow（硅基流动） |
| **API地址** | `https://api.siliconflow.cn/v1/chat/completions` |
| **应用场景** | 中文提示词翻译为英文、电商文案生成（标题/卖点/描述/社交文案/广告语）、详情页文案生成、海报文案生成 |
| **收费状态** | **部分免费** |
| **输入价格** | ¥2/百万Token |
| **输出价格** | ¥8/百万Token |
| **免费额度** | SiliconFlow平台注册赠送额度可覆盖大量调用 |
| **超出额度计费** | 按Token计费，输入¥2/百万Token，输出¥8/百万Token |

### 2.4 本地处理（无AI模型）

| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 提示词增强 | `promptEnhancer.ts` | 本地规则引擎，无AI调用 |
| 风格/色彩/构图映射 | `imageGenerator.ts` | 本地预设字典映射 |
| 客户端Canvas超分 | `upscale.ts` | 浏览器Canvas API |
| 服务端Lanczos超分 | `upscale-server.ts` | Sharp库Lanczos3插值 |
| 水印添加 | `watermark.ts` | Sharp SVG合成 |

### 2.5 模型路由策略

系统采用智能路由策略，根据用户等级和提示词语言自动选择最优模型：

1. **用户等级过滤**：free用户只能用free tier模型，pro用户可用free+pro模型，business用户可用所有模型
2. **中文检测**：检测提示词中中文字符占比>20%时，优先选择支持中文的模型
3. **质量优先排序**：在可用模型中按quality评分降序选择
4. **回退机制**：首选模型失败后，依次尝试其他可用模型，最终回退到Pollinations
5. **Provider优先级**：Gemini → 阿里百炼 → SiliconFlow → Pollinations

---

## 三、各AI模型收费详情汇总

### 3.1 免费可用的模型

| 模型 | 提供商 | 免费额度 | 超出后计费 | 备注 |
|------|--------|----------|------------|------|
| FLUX.1 Schnell | Pollinations | **无限制** | 不适用 | 完全免费，无API Key |
| Gemini 2.5 Flash Image | Google | 15 RPM / 1,500 RPD | 输入$0.15/M Token，输出$0.60/M Token | 需API Key |
| Z-Image Turbo | SiliconFlow | 平台赠送额度 | $0.005/张 | 极低成本 |
| 通义万相 2.1 Turbo | 阿里百炼 | 新用户~5000张 | ¥0.04/张 | 需API Key |
| DeepSeek-V3 | SiliconFlow | 平台赠送额度 | 输入¥2/M Token，输出¥8/M Token | 文本生成 |

### 3.2 付费模型

| 模型 | 提供商 | 单价 | 适用套餐 | 备注 |
|------|--------|------|----------|------|
| FLUX.2 Pro | SiliconFlow | $0.03/张 | Pro | 高质量首选 |
| FLUX.2 Flex | SiliconFlow | $0.06/张 | Business | 商业用途 |
| Imagen 4 Fast | Google | $0.02/张 | Pro | 快速高质量 |
| 通义万相 2.6 | 阿里百炼 | ¥0.20/张 | Pro | 电商场景 |
| wanx2.1-imageedit | 阿里百炼 | ¥0.14/张 | Pro/Business | 抠图/换背景/超分 |
| Remove.bg | Kaleido AI | $9/月起 | - | 抠图专用 |

### 3.3 每用户等级可用模型与成本估算

| 用户等级 | 可用模型 | 单张成本范围 | 月度成本估算（满额使用） |
|----------|----------|-------------|------------------------|
| Free | Gemini 2.5 Flash, Z-Image Turbo, 通义万相2.1 Turbo, FLUX.1 Schnell | $0 ~ $0.005 | ≈ $0（10张/天×30天=300张，主要用免费模型） |
| Pro | + FLUX.2 Pro, 通义万相2.6, Imagen 4 Fast | $0 ~ $0.20 | 300张×$0.03 ≈ $9（FLUX.2 Pro为主） |
| Business | + FLUX.2 Flex | $0 ~ $0.06 | 800张×$0.06 ≈ $48（FLUX.2 Flex为主） |

---

## 四、支付系统评估

### 4.1 现有支付系统架构

```
用户 → PaymentButton组件 → /api/checkout → Stripe Checkout Session → 用户支付 → Webhook回调
```

**当前套餐定价：**

| 套餐 | 月付 | 年付 | 日生成 | 月生成 | 抠图/月 | 文案/月 |
|------|------|------|--------|--------|---------|---------|
| Free | $0 | $0 | 10 | 300 | 0 | 3 |
| Pro | $7.99 | $59.99 | 50 | 300 | 20 | 100 |
| Business | $14.99 | $119.99 | 999 | 800 | 999 | 999 |

### 4.2 存在的严重问题

#### 🔴 严重级别

| # | 问题 | 影响 | 涉及文件 |
|---|------|------|----------|
| 1 | **Webhook未实际更新数据库** | 支付成功后用户等级不自动变更，需手动处理 | `api/webhook/route.ts` |
| 2 | **配额系统使用内存Map** | 服务器重启后所有用户配额数据丢失 | `lib/quota.ts` |
| 3 | **用户身份硬编码** | `userId = "default"`，所有用户共享配额 | `api/generate/route.ts` |
| 4 | **认证系统使用Mock用户** | NextAuth仅验证硬编码的demo用户，其他用户直接放行 | `api/auth/[...nextauth]/route.ts` |
| 5 | **JWT密钥硬编码回退** | `JWT_SECRET` 回退值为 `"your-secret-key"` | `api/auth/login/route.ts` |

#### 🟡 中等级别

| # | 问题 | 影响 | 涉及文件 |
|---|------|------|----------|
| 6 | **仅支持Stripe信用卡支付** | 中国用户无法使用支付宝/微信支付 | `api/checkout/route.ts` |
| 7 | **仅支持USD货币** | 定价页面显示$，无CNY选项 | `stripe.ts`, `pricing/page.tsx` |
| 8 | **PaymentIcon组件定义了微信/支付宝但未接入** | UI展示误导用户 | `components/payments/PaymentIcon.tsx` |
| 9 | **无支付确认邮件** | 用户支付后无邮件通知 | - |
| 10 | **无退款逻辑** | 无法处理退款请求 | - |
| 11 | **订阅切换逻辑有Bug** | switch路由中`items[0].id`使用了subscriptionId而非itemId | `api/subscription/switch/route.ts` |
| 12 | **免费用户3秒排队延迟** | `await new Promise(resolve => setTimeout(resolve, 3000))` | 多个API路由 |

#### 🟢 轻微级别

| # | 问题 | 影响 | 涉及文件 |
|---|------|------|----------|
| 13 | **订阅管理页面未国际化** | 全英文界面 | `dashboard/subscription/page.tsx` |
| 14 | **无支付安全防护** | 无CSRF保护、无支付接口限流 | `api/checkout/route.ts` |
| 15 | **Stripe未配置时返回503** | 无友好降级提示 | `api/checkout/route.ts` |
| 16 | **定价页面货币符号混乱** | PaymentButton默认CNY但实际为USD | `components/payments/PaymentButton.tsx` |

---

## 五、支付系统完善方案

### 5.1 第一阶段：核心问题修复（高优先级）

#### 任务1：Webhook实际更新数据库

**目标**：支付成功后自动更新用户订阅状态

**实施步骤**：
1. 在 `api/webhook/route.ts` 中实现完整的Webhook处理逻辑
2. `checkout.session.completed` 事件：从session metadata获取userId和plan，更新Subscription表
3. `customer.subscription.updated` 事件：同步更新plan和status
4. `customer.subscription.deleted` 事件：将plan降级为free，status设为inactive
5. `invoice.payment_failed` 事件：标记subscription为past_due
6. 在checkout创建时添加metadata：`{ userId, plan, billingPeriod }`

**涉及文件**：
- `src/app/api/webhook/route.ts` — 重写Webhook处理
- `src/app/api/checkout/route.ts` — 添加metadata
- `src/lib/stripe.ts` — 可能需要添加辅助函数

#### 任务2：配额系统持久化

**目标**：将配额数据从内存Map迁移到数据库

**实施步骤**：
1. 在Prisma schema中添加UsageRecord模型
2. 创建数据库迁移
3. 重写 `quota.ts` 中的所有函数使用Prisma查询
4. 添加定时清理过期记录的逻辑（可使用Prisma批量删除）

**涉及文件**：
- `prisma/schema.prisma` — 添加UsageRecord模型
- `src/lib/quota.ts` — 重写为数据库持久化
- 所有使用quota的API路由 — 适配新接口

#### 任务3：修复用户身份认证

**目标**：API路由使用真实用户身份而非硬编码

**实施步骤**：
1. 修复NextAuth authorize函数，使用Prisma查询真实用户
2. 在API路由中从session/token获取userId
3. 替换所有 `userId = "default"` 为实际用户ID
4. 添加未认证请求的拦截中间件

**涉及文件**：
- `src/app/api/auth/[...nextauth]/route.ts` — 修复authorize
- `src/app/api/generate/route.ts` — 使用真实userId
- `src/app/api/copywriting/route.ts` — 使用真实userId
- `src/app/api/remove-background/route.ts` — 使用真实userId
- 其他所有API路由

#### 任务4：修复JWT密钥安全

**目标**：移除硬编码的JWT密钥回退值

**实施步骤**：
1. 移除 `JWT_SECRET` 的回退值，在未配置时抛出错误
2. 在 `.env.example` 中添加 `JWT_SECRET` 说明
3. 添加环境变量验证启动检查

**涉及文件**：
- `src/app/api/auth/login/route.ts` — 移除回退值
- `.env.example` — 添加JWT_SECRET

### 5.2 第二阶段：支付渠道扩展（中优先级）

#### 任务5：接入支付宝支付

**目标**：支持中国用户使用支付宝付款

**实施步骤**：
1. 集成支付宝开放平台SDK（alipay-sdk）
2. 创建支付宝支付API路由 `/api/checkout/alipay`
3. 实现支付宝当面付（扫码支付）或电脑网站支付
4. 实现支付宝异步通知回调 `/api/webhook/alipay`
5. 在PaymentButton中添加支付宝支付选项
6. 在定价页面添加支付宝图标和选项

**涉及文件**：
- 新建 `src/lib/alipay.ts` — 支付宝配置
- 新建 `src/app/api/checkout/alipay/route.ts`
- 新建 `src/app/api/webhook/alipay/route.ts`
- 修改 `src/components/payments/PaymentButton.tsx`
- 修改 `src/app/pricing/page.tsx`

#### 任务6：接入微信支付

**目标**：支持中国用户使用微信支付

**实施步骤**：
1. 集成微信支付SDK（wechatpay-node-v3）
2. 创建微信Native支付（扫码支付）API路由
3. 实现微信支付回调 `/api/webhook/wechat`
4. 在PaymentButton中添加微信支付选项
5. 在定价页面添加微信支付图标和选项

**涉及文件**：
- 新建 `src/lib/wechat-pay.ts` — 微信支付配置
- 新建 `src/app/api/checkout/wechat/route.ts`
- 新建 `src/app/api/webhook/wechat/route.ts`
- 修改 `src/components/payments/PaymentButton.tsx`
- 修改 `src/app/pricing/page.tsx`

#### 任务7：多币种支持

**目标**：支持USD和CNY双币种定价

**实施步骤**：
1. 在 `stripe.ts` 的PLANS中添加CNY定价
2. 创建Stripe CNY Price ID
3. 在定价页面添加货币切换功能
4. 根据用户地区自动推荐币种
5. PaymentButton组件适配多币种

**涉及文件**：
- `src/lib/stripe.ts` — 添加CNY定价
- `src/app/pricing/page.tsx` — 货币切换
- `src/components/payments/PaymentButton.tsx` — 多币种

### 5.3 第三阶段：安全与体验增强（中优先级）

#### 任务8：支付安全防护

**目标**：增强支付流程安全性

**实施步骤**：
1. 添加CSRF Token验证（使用NextAuth内置CSRF）
2. 对支付API添加速率限制（如10次/分钟/IP）
3. 实现支付请求签名验证
4. 添加支付金额服务端二次校验
5. 记录支付审计日志到数据库

**涉及文件**：
- 新建 `src/middleware.ts` — 速率限制
- 修改 `src/app/api/checkout/route.ts` — 安全增强
- 新建 `src/lib/payment-security.ts` — 安全工具函数

#### 任务9：支付流程优化

**目标**：简化用户支付流程，提升转化率

**实施步骤**：
1. 添加支付方式选择步骤（Stripe/支付宝/微信）
2. 实现支付进度指示器
3. 添加支付成功/失败邮件通知
4. 实现订单确认页面
5. 添加优惠券/折扣码功能
6. 移除免费用户3秒人为延迟（改用更合理的排队机制）

**涉及文件**：
- 修改 `src/components/payments/PaymentButton.tsx`
- 新建 `src/app/api/coupon/route.ts` — 优惠券
- 新建 `src/lib/email.ts` — 邮件通知
- 修改各API路由 — 移除3秒延迟

#### 任务10：退款与售后

**目标**：支持退款流程

**实施步骤**：
1. 创建退款API路由 `/api/refund`
2. 集成Stripe Refund API
3. 添加退款申请页面（Dashboard内）
4. 实现退款审批流程（管理员）
5. 退款成功后自动降级用户套餐

**涉及文件**：
- 新建 `src/app/api/refund/route.ts`
- 新建 `src/app/dashboard/refund/page.tsx`
- 修改 `src/lib/stripe.ts` — 添加refund函数

### 5.4 第四阶段：订阅管理完善（低优先级）

#### 任务11：修复订阅切换Bug

**目标**：修复switch路由中的subscription item ID错误

**实施步骤**：
1. 修复 `subscription/switch/route.ts` 中的items参数
2. 正确获取subscription item ID：`subscription.items.data[0].id`
3. 添加proration预览功能
4. 添加切换确认对话框

**涉及文件**：
- `src/app/api/subscription/switch/route.ts`

#### 任务12：订阅管理国际化

**目标**：订阅管理页面支持中英文

**实施步骤**：
1. 在i18n中添加订阅管理相关翻译
2. 替换SubscriptionPage中所有硬编码英文文本
3. 添加语言切换支持

**涉及文件**：
- `src/lib/i18n.ts` — 添加翻译
- `src/app/dashboard/subscription/page.tsx` — 国际化

---

## 六、实施优先级与依赖关系

```
第一阶段（核心修复）：
  任务1 (Webhook) ←→ 任务2 (配额持久化) ←→ 任务3 (用户认证) → 任务4 (JWT安全)
  
第二阶段（支付扩展）：
  任务5 (支付宝) ∥ 任务6 (微信支付) → 任务7 (多币种)
  
第三阶段（安全体验）：
  任务8 (安全防护) ∥ 任务9 (流程优化) → 任务10 (退款售后)
  
第四阶段（订阅完善）：
  任务11 (切换Bug) ∥ 任务12 (国际化)
```

**关键依赖**：
- 任务5/6依赖任务1（Webhook必须先正常工作）
- 任务7依赖任务5/6（多币种需要多支付渠道）
- 任务9依赖任务3（流程优化需要真实用户认证）
- 任务10依赖任务1和任务8（退款需要Webhook和安全防护）

---

## 七、风险提示

1. **支付宝/微信支付需要企业资质**：个人开发者无法直接接入，需通过第三方聚合支付平台（如Ping++、收钱吧等）
2. **Stripe在中国大陆的可用性**：Stripe目前不支持中国大陆商户直接注册，需使用香港/新加坡实体
3. **数据迁移风险**：配额系统从内存迁移到数据库时，需确保不丢失现有用户数据
4. **Webhook幂等性**：Stripe可能重复发送Webhook，处理逻辑必须幂等
5. **汇率波动**：多币种定价需考虑汇率波动风险
