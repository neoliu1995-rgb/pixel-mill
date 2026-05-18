# PixelMill 全面升级计划

## 一、现状诊断

### 1.1 当前问题清单

| 问题 | 严重程度 | 说明 |
|------|---------|------|
| 图像生成质量差 | 🔴 严重 | 仅使用 Pollinations 免费API（FLUX-schnell/SDXL/Turbo），质量远低于 NanoBanana 水平 |
| 中文提示词处理粗糙 | 🔴 严重 | 简单的字典替换翻译，大量中文词汇丢失，导致生成结果与用户意图严重偏离 |
| 抠图功能不可用 | 🔴 严重 | Remove.bg API未配置，Pollinations fallback根本无法抠图 |
| 白底图功能不可用 | 🔴 严重 | 同上，且 Pollinations 无法精确替换背景 |
| 放大功能是假放大 | 🟡 中等 | 仅用 Canvas 双线性插值，非AI超分，放大后模糊 |
| 无电商专用功能 | 🔴 严重 | 缺少电商海报、文案生成、详情页等核心电商工具 |
| 会员模型无差异化 | 🟡 中等 | 免费用户和付费用户使用相同的免费模型，付费无感知价值 |
| 无AI文案能力 | 🟡 中等 | 缺少商品文案、营销文案等电商刚需功能 |

### 1.2 当前技术栈

- **图像生成**: Pollinations API（免费，质量差）
- **抠图**: Remove.bg（未配置key）+ Pollinations fallback（不可用）
- **放大**: Canvas 双线性插值（非AI）
- **支付**: Stripe（未完全接入）
- **数据库**: SQLite + Prisma
- **框架**: Next.js 15 + React 18 + Tailwind CSS

---

## 二、AI模型选型方案

### 2.1 图像生成模型对比

| 模型 | 平台 | 单价(元/张) | 质量 | 中文支持 | 速度 | 推荐用途 |
|------|------|-----------|------|---------|------|---------|
| **FLUX.2 [pro]** | SiliconFlow | ¥0.22 ($0.03) | ⭐⭐⭐⭐⭐ | 英文为主 | 3-5s | 付费用户主力模型 |
| **FLUX.2 [flex]** | SiliconFlow | ¥0.44 ($0.06) | ⭐⭐⭐⭐⭐ | 英文为主 | 5-8s | 付费用户高质量模式 |
| **Z-Image-Turbo** | SiliconFlow | ¥0.036 ($0.005) | ⭐⭐⭐⭐ | 英文为主 | 1-2s | 免费用户/快速预览 |
| **通义万相 wan2.6** | 阿里百炼 | ¥0.20 | ⭐⭐⭐⭐ | ✅ 中文原生 | 5-10s | 中文提示词首选 |
| **通义万相轻量版** | 阿里百炼 | ¥0.04 | ⭐⭐⭐ | ✅ 中文原生 | 2-5s | 免费用户中文生成 |
| **混元生图** | 腾讯云 | ¥0.50 | ⭐⭐⭐⭐ | ✅ 中文原生 | 5-10s | 备选 |
| **混元轻量版** | 腾讯云 | ¥0.099 | ⭐⭐⭐ | ✅ 中文原生 | 2-5s | 备选免费 |
| **Qwen-Image** | SiliconFlow | ¥0.30 | ⭐⭐⭐⭐ | ✅ 中文原生 | 5-8s | 中文图文混合/海报 |
| Pollinations (现有) | Pollinations | ¥0 | ⭐⭐ | ❌ | 10-30s | 最低保底 |

### 2.2 推荐模型分层策略

```
┌─────────────────────────────────────────────────────┐
│  免费用户层                                          │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ Z-Image-Turbo│  │ 通义万相轻量版│                 │
│  │ ¥0.036/张    │  │ ¥0.04/张     │                 │
│  │ 英文提示词   │  │ 中文提示词    │                 │
│  └──────────────┘  └──────────────┘                 │
│  月限额: 30张/月                                     │
├─────────────────────────────────────────────────────┤
│  专业版用户层 (¥9.99/月)                             │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ FLUX.2 [pro] │  │ 通义万相2.6  │                 │
│  │ ¥0.22/张     │  │ ¥0.20/张     │                 │
│  │ 英文高质量   │  │ 中文高质量    │                 │
│  └──────────────┘  └──────────────┘                 │
│  月限额: 500张/月                                    │
├─────────────────────────────────────────────────────┤
│  企业版用户层 (¥29.99/月)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ FLUX.2[flex] │  │ Qwen-Image  │  │ 图像编辑  │ │
│  │ ¥0.44/张     │  │ ¥0.30/张    │  │ ¥0.14/张  │ │
│  │ 最高质量     │  │ 图文混合    │  │ 万相编辑  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│  月限额: 无限                                        │
└─────────────────────────────────────────────────────┘
```

### 2.3 抠图/背景替换模型选型

| 方案 | 单价 | 质量 | 说明 |
|------|------|------|------|
| **Remove.bg API** | ¥0.35/张 ($0.05) | ⭐⭐⭐⭐⭐ | 行业标杆，精度最高 |
| **通义万相图像编辑** | ¥0.14/张 | ⭐⭐⭐⭐ | 支持抠图+换背景+风格迁移，性价比极高 |
| **rembg 自部署** | ¥0 (服务器成本) | ⭐⭐⭐⭐ | 开源方案，需GPU服务器 |

**推荐方案**: 通义万相图像编辑（wanx2.1-imageedit）作为主力，¥0.14/张，同时支持抠图、换背景、风格迁移、去水印、扩图、超分等全套功能，一个API解决所有图像编辑需求。

### 2.4 AI文案生成模型选型

| 模型 | 平台 | 价格(元/M tokens) | 说明 |
|------|------|-------------------|------|
| **DeepSeek-V3** | SiliconFlow | 输入¥2/输出¥8 | 性价比最高，中文能力强 |
| **Qwen3-235B** | SiliconFlow | 输入¥2.5/输出¥10 | 阿里旗舰，电商文案最佳 |
| **DeepSeek-R1** | SiliconFlow | 输入¥4/输出¥16 | 推理能力强，适合复杂文案 |

**推荐方案**: DeepSeek-V3 作为文案生成主力（极低成本），Qwen3-235B 作为高质量文案备选。

### 2.5 成本测算

#### 免费用户成本（按30张/月）

| 项目 | 模型 | 单价 | 月用量 | 月成本 |
|------|------|------|--------|--------|
| 图像生成 | Z-Image-Turbo | ¥0.036 | 20张 | ¥0.72 |
| 图像生成(中文) | 通义轻量版 | ¥0.04 | 10张 | ¥0.40 |
| **小计** | | | | **¥1.12/用户/月** |

#### 专业版用户成本（按300张/月实际使用）

| 项目 | 模型 | 单价 | 月用量 | 月成本 |
|------|------|------|--------|--------|
| 图像生成 | FLUX.2 [pro] | ¥0.22 | 200张 | ¥44 |
| 图像生成(中文) | 通义万相2.6 | ¥0.20 | 80张 | ¥16 |
| 图像编辑 | 万相编辑 | ¥0.14 | 20张 | ¥2.8 |
| 文案生成 | DeepSeek-V3 | ~¥0.01/次 | 50次 | ¥0.5 |
| **小计** | | | | **¥63.3/用户/月** |
| **收入** | | | | **¥79.99(年付)/¥99.99(月付)** |
| **毛利率** | | | | **20%-37%** |

#### 企业版用户成本（按800张/月实际使用）

| 项目 | 模型 | 单价 | 月用量 | 月成本 |
|------|------|------|--------|--------|
| 图像生成 | FLUX.2 [flex] | ¥0.44 | 400张 | ¥176 |
| 图像生成(中文) | Qwen-Image | ¥0.30 | 200张 | ¥60 |
| 图像编辑 | 万相编辑 | ¥0.14 | 100张 | ¥14 |
| 文案生成 | DeepSeek-V3 | ~¥0.01/次 | 200次 | ¥2 |
| **小计** | | | | **¥252/用户/月** |
| **收入** | | | | **¥239.99(年付)/¥299.99(月付)** |
| **毛利率** | | | | **-5%~16%** |

> ⚠️ 企业版毛利率偏低，需要通过限制高频用户或引入额外计费（如超出配额按量付费）来保证盈利。

---

## 三、功能升级方案

### 3.1 核心功能升级（Phase 1 - 基础质量提升）

#### 3.1.1 图像生成引擎重构

**目标**: 替换 Pollinations 为多模型智能路由系统

**实现方案**:
1. 新增 `src/lib/providers/` 目录，按提供商封装API调用
2. 实现 `SiliconFlowProvider` - 调用 FLUX.2/Z-Image-Turbo
3. 实现 `AliBailianProvider` - 调用通义万相
4. 实现 `TencentHunyuanProvider` - 调用混元（备选）
5. 保留 `PollinationsProvider` 作为最终兜底
6. 重构 `imageGenerator.ts` 的智能路由逻辑：
   - 检测中文提示词 → 路由到通义万相
   - 检测英文提示词 → 路由到 FLUX.2
   - 根据用户等级选择对应质量模型
   - 失败自动降级到下一个可用提供商

**关键代码改动**:
- `src/lib/imageGenerator.ts` - 重构为多提供商架构
- `src/app/api/generate/route.ts` - 传递用户等级信息
- `src/lib/providers/siliconflow.ts` - 新增
- `src/lib/providers/alibailian.ts` - 新增
- `.env` - 新增 API Key 配置

#### 3.1.2 中文提示词智能翻译

**目标**: 替换简单字典翻译为AI翻译，大幅提升中文用户体验

**实现方案**:
1. 使用 DeepSeek-V3 API 将中文提示词翻译为高质量英文
2. 缓存翻译结果（相同提示词不重复调用）
3. 保留通义万相作为中文原生模型（无需翻译）
4. 翻译时自动添加质量增强关键词

**关键代码改动**:
- `src/lib/promptEnhancer.ts` - 新增 AI 翻译功能
- `src/lib/imageGenerator.ts` - 集成翻译到生成流程

#### 3.1.3 抠图与背景替换重构

**目标**: 让抠图和白底图功能真正可用

**实现方案**:
1. 使用通义万相图像编辑 API（wanx2.1-imageedit）
2. 支持功能：抠图(透明底)、换白底、换纯色底、换场景底
3. 保留 Remove.bg 作为备选
4. 移除 Pollinations fallback（完全不可用）

**关键代码改动**:
- `src/app/api/remove-background/route.ts` - 重构为万相编辑API
- `src/app/api/white-background/route.ts` - 重构为万相编辑API
- `src/lib/providers/alibailian-imageedit.ts` - 新增

### 3.2 电商专用功能（Phase 2 - 电商工具箱）

#### 3.2.1 产品白底图生成

**场景**: 电商卖家上传产品图，一键生成符合平台规范的白底图

**功能设计**:
- 上传产品图 → AI抠图 → 自动添加白色/浅灰背景
- 支持添加阴影效果（自然投影/倒影）
- 支持批量处理（多张同时生成）
- 输出符合淘宝/京东/拼多多规范尺寸（800×800）

**API调用链**: 
```
用户上传 → 万相图像编辑(抠图+白底) → 返回结果
```

#### 3.2.2 电商海报生成

**场景**: 产品图 + 文案 → 一键生成营销海报

**功能设计**:
- 输入产品图 + 选择海报模板（大促/新品/日常/节日）
- AI自动生成营销文案（标题+副标题+卖点）
- 将产品图融入海报场景
- 支持多种尺寸（淘宝主图/详情页头图/社交媒体/朋友圈）
- 支持自定义品牌色和Logo

**API调用链**:
```
产品图 + 模板选择 → DeepSeek-V3(文案) → Qwen-Image(图文海报) → 返回
```

#### 3.2.3 AI文案生成器

**场景**: 输入产品信息，自动生成多平台营销文案

**功能设计**:
- 输入：产品名称、品类、核心卖点、目标人群
- 输出：
  - 商品标题（SEO优化，含关键词）
  - 五点描述（Bullet Points）
  - 详细描述（详情页长文案）
  - 社交媒体文案（小红书/抖音/微信风格）
  - 广告语（短文案）
- 支持多语言（中文/英文/日文/韩文）
- 支持风格切换（专业/活泼/文艺/促销）

**API调用链**:
```
产品信息 → DeepSeek-V3(文案生成) → 返回多版本文案
```

#### 3.2.4 详情页生成器

**场景**: 产品图 + 文案 → 自动生成完整电商详情页

**功能设计**:
- 输入：产品图 + 基础信息
- 自动生成详情页模块：
  1. 头图/主视觉
  2. 产品卖点图（3-5个核心卖点）
  3. 场景展示图
  4. 规格参数表
  5. 使用说明/对比图
  6. 品牌故事/保障信息
- 输出为HTML/CSS（可直接粘贴到淘宝/京东编辑器）
- 支持模板选择和自定义配色

**API调用链**:
```
产品信息 → DeepSeek-V3(文案+结构) → FLUX.2/Qwen-Image(配图) → HTML合成 → 返回
```

#### 3.2.5 产品场景图生成

**场景**: 白底产品图 → 置入各种使用场景

**功能设计**:
- 上传产品白底图
- 选择/输入场景描述（客厅/办公室/户外/厨房等）
- AI将产品自然融入场景
- 支持生成多个场景变体
- 支持指定光线风格（自然光/暖光/冷光/影棚光）

**API调用链**:
```
产品图 + 场景描述 → 万相图像编辑(场景融合) / FLUX.2(img2img) → 返回
```

### 3.3 会员体系升级（Phase 3 - 商业化完善）

#### 3.3.1 会员等级与模型对应

| 功能 | 免费版 | 专业版 ¥9.99/月 | 企业版 ¥29.99/月 |
|------|--------|-----------------|------------------|
| 图像生成模型 | Z-Image-Turbo/通义轻量 | FLUX.2 [pro]/通义2.6 | FLUX.2 [flex]/Qwen-Image |
| 月生成次数 | 30张 | 500张 | 无限 |
| 最大分辨率 | 512×512 | 1024×1024 | 2048×2048 |
| 抠图/换背景 | ❌ | ✅ 20次/月 | ✅ 无限 |
| AI文案生成 | ❌ | ✅ 50次/月 | ✅ 无限 |
| 电商海报 | ❌ | ✅ 10次/月 | ✅ 无限 |
| 详情页生成 | ❌ | ❌ | ✅ 无限 |
| 场景图生成 | ❌ | ✅ 10次/月 | ✅ 无限 |
| 批量处理 | ❌ | ✅ | ✅ |
| API访问 | ❌ | ✅ | ✅ |
| 商业授权 | ❌ | ✅ | ✅ |
| 优先队列 | ❌ | ✅ | ✅✅ |

#### 3.3.2 按量付费补充

对于超出配额的用户，提供按量付费：
- 图像生成: ¥0.30/张（标准）/ ¥0.50/张（高清）
- 抠图: ¥0.20/次
- 文案: ¥0.05/次
- 海报: ¥1.00/次

### 3.4 AI超分升级（Phase 1）

**目标**: 替换 Canvas 插值放大为真正的AI超分

**实现方案**:
1. 使用通义万相图像编辑的"图像超分"功能
2. 支持放大2倍/4倍
3. 保留 Canvas 方式作为离线/免费用户备选

**关键代码改动**:
- `src/lib/upscale.ts` - 新增 AI 超分调用
- `src/app/api/upscale/route.ts` - 新增超分API路由

---

## 四、技术实现架构

### 4.1 多提供商架构

```
src/lib/providers/
├── base.ts              # Provider 基类接口
├── siliconflow.ts       # SiliconFlow (FLUX.2, Z-Image-Turbo)
├── alibailian.ts        # 阿里百炼 (通义万相文生图)
├── alibailian-edit.ts   # 阿里百炼 (万相图像编辑)
├── tencent-hunyuan.ts   # 腾讯混元 (备选)
├── pollinations.ts      # Pollinations (兜底)
└── router.ts            # 智能路由引擎
```

### 4.2 新增API路由

```
src/app/api/
├── generate/route.ts        # 重构：多提供商生成
├── remove-background/route.ts  # 重构：万相编辑
├── white-background/route.ts   # 重构：万相编辑
├── upscale/route.ts         # 新增：AI超分
├── copywriting/route.ts     # 新增：AI文案生成
├── poster/route.ts          # 新增：电商海报生成
├── detail-page/route.ts     # 新增：详情页生成
└── scene-image/route.ts     # 新增：场景图生成
```

### 4.3 新增页面/组件

```
src/app/
├── ecommerce/
│   └── page.tsx             # 新增：电商工具箱主页
├── copywriting/
│   └── page.tsx             # 新增：AI文案生成页
└── background-remover/
    └── page.tsx             # 重构：独立抠图工具页

src/components/
├── ecommerce/
│   ├── ProductWhiteBg.tsx   # 新增：白底图生成
│   ├── PosterGenerator.tsx  # 新增：海报生成器
│   ├── CopywritingTool.tsx  # 新增：文案工具
│   ├── DetailPageBuilder.tsx# 新增：详情页生成器
│   └── SceneGenerator.tsx   # 新增：场景图生成
└── generator/
    └── ModelSelector.tsx    # 重构：按用户等级展示可用模型
```

### 4.4 数据库Schema更新

```prisma
model GenerationHistory {
  id          String   @id @default(cuid())
  userId      String
  prompt      String
  model       String
  provider    String   // 新增：提供商标识
  imageUrl    String
  type        String   @default("text2img") // 新增：生成类型
  cost        Float    @default(0)  // 新增：本次调用成本
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UsageQuota {
  id                String   @id @default(cuid())
  userId            String   @unique
  month             String   // 格式: "2026-05"
  generationsUsed   Int      @default(0)
  copywritingUsed   Int      @default(0)
  posterUsed        Int      @default(0)
  bgRemovalUsed     Int      @default(0)
  sceneUsed         Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## 五、环境变量配置

```env
# SiliconFlow (FLUX.2, Z-Image-Turbo, DeepSeek)
SILICONFLOW_API_KEY=sk-xxx

# 阿里百炼 (通义万相)
ALIBAILIAN_API_KEY=sk-xxx

# 腾讯混元 (备选)
TENCENT_HUNYUAN_API_KEY=xxx

# Remove.bg (备选抠图)
REMOVE_BG_API_KEY=xxx

# Stripe (支付)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_xxx
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_xxx
```

---

## 六、实施计划

### Phase 1: 基础质量提升（优先级最高）

| 步骤 | 任务 | 涉及文件 |
|------|------|---------|
| 1.1 | 搭建多提供商架构 | `src/lib/providers/` 全部文件 |
| 1.2 | 实现 SiliconFlow Provider | `src/lib/providers/siliconflow.ts` |
| 1.3 | 实现阿里百炼 Provider | `src/lib/providers/alibailian.ts` |
| 1.4 | 重构智能路由引擎 | `src/lib/providers/router.ts`, `src/lib/imageGenerator.ts` |
| 1.5 | 实现AI提示词翻译 | `src/lib/promptEnhancer.ts` |
| 1.6 | 重构抠图API | `src/app/api/remove-background/route.ts` |
| 1.7 | 重构白底图API | `src/app/api/white-background/route.ts` |
| 1.8 | 实现AI超分 | `src/lib/upscale.ts`, `src/app/api/upscale/route.ts` |
| 1.9 | 更新模型选择器UI | `src/components/generator/ModelSelector.tsx` |
| 1.10 | 更新会员模型权限 | `src/lib/stripe.ts`, 生成API |
| 1.11 | 环境变量配置 | `.env` |
| 1.12 | 测试验证 | 全流程测试 |

### Phase 2: 电商工具箱

| 步骤 | 任务 | 涉及文件 |
|------|------|---------|
| 2.1 | AI文案生成API | `src/app/api/copywriting/route.ts` |
| 2.2 | 文案生成UI | `src/components/ecommerce/CopywritingTool.tsx` |
| 2.3 | 电商海报生成API | `src/app/api/poster/route.ts` |
| 2.4 | 海报生成UI | `src/components/ecommerce/PosterGenerator.tsx` |
| 2.5 | 产品场景图API | `src/app/api/scene-image/route.ts` |
| 2.6 | 场景图生成UI | `src/components/ecommerce/SceneGenerator.tsx` |
| 2.7 | 白底图生成UI优化 | `src/components/ecommerce/ProductWhiteBg.tsx` |
| 2.8 | 电商工具箱主页 | `src/app/ecommerce/page.tsx` |
| 2.9 | 详情页生成API | `src/app/api/detail-page/route.ts` |
| 2.10 | 详情页生成UI | `src/components/ecommerce/DetailPageBuilder.tsx` |
| 2.11 | 测试验证 | 全流程测试 |

### Phase 3: 商业化完善

| 步骤 | 任务 | 涉及文件 |
|------|------|---------|
| 3.1 | 使用配额系统 | `prisma/schema.prisma`, 新增UsageQuota模型 |
| 3.2 | 配额检查中间件 | `src/lib/quota.ts` |
| 3.3 | 按量付费逻辑 | `src/app/api/checkout/route.ts` |
| 3.4 | 会员定价调整 | `src/lib/stripe.ts` |
| 3.5 | 定价页面更新 | `src/app/pricing/page.tsx` |
| 3.6 | Dashboard配额展示 | `src/app/dashboard/subscription/page.tsx` |
| 3.7 | 测试验证 | 全流程测试 |

---

## 七、风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| API提供商涨价 | 中 | 高 | 多提供商冗余，可快速切换 |
| API提供商下线模型 | 中 | 中 | 路由引擎自动降级到备选 |
| 免费用户滥用 | 高 | 中 | 严格配额限制+验证码 |
| 企业版成本倒挂 | 中 | 高 | 引入超额按量付费+限制高频调用 |
| 生成内容合规风险 | 低 | 高 | 接入内容审核API+敏感词过滤 |

---

## 八、成功指标

| 指标 | 当前 | Phase 1 目标 | Phase 2 目标 |
|------|------|-------------|-------------|
| 图像生成质量评分 | 60/100 | 85/100 | 90/100 |
| 中文提示词成功率 | 30% | 80% | 90% |
| 抠图功能可用性 | 0% | 95% | 99% |
| 付费转化率 | 0% | 2% | 5% |
| 用户月留存率 | 未知 | 30% | 45% |
| 电商工具使用率 | N/A | N/A | 40% of pro users |
