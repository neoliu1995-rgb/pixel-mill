import {
  ImageProvider,
  ProviderImageResult,
  ProviderGenerateOptions,
  ProviderModelInfo,
} from "./base";

const API_BASE = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
const TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks/";
const POLL_INTERVAL = 2000;
const MAX_POLL_TIME = 50000;

const MODELS: ProviderModelInfo[] = [
  {
    id: "wanx2.6-t2i",
    name: "通义万相 2.6",
    provider: "alibailian",
    tier: "pro",
    quality: 5,
    speed: 3,
    costPerImage: 0.2,
    supportsImg2Img: false,
    supportsChinese: true,
    bestFor: ["电商主图", "创意设计", "中文提示词"],
  },
  {
    id: "wanx2.1-t2i-turbo",
    name: "通义万相 2.1 Turbo",
    provider: "alibailian",
    tier: "free",
    quality: 3,
    speed: 5,
    costPerImage: 0.04,
    supportsImg2Img: false,
    supportsChinese: true,
    bestFor: ["快速出图", "概念验证", "中文提示词"],
  },
];

function getApiKey(): string | undefined {
  return process.env.ALIBAILIAN_API_KEY;
}

async function pollTask(taskId: string, apiKey: string): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < MAX_POLL_TIME) {
    const res = await fetch(`${TASK_URL}${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) {
      throw new Error(`查询任务失败: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const status = data?.output?.task_status;
    if (status === "SUCCEEDED") {
      const url = data?.output?.results?.[0]?.url;
      if (!url) {
        throw new Error("任务成功但未返回图片URL");
      }
      return url;
    }
    if (status === "FAILED") {
      const message = data?.output?.message || "未知错误";
      throw new Error(`任务失败: ${message}`);
    }
    if (status === "CANCELED") {
      throw new Error("任务已取消");
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error("任务超时，超过50秒未完成");
}

async function downloadAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`下载图片失败: ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export class AliBailianImageProvider implements ImageProvider {
  name = "alibailian";
  models = MODELS;

  isAvailable(): boolean {
    return !!getApiKey();
  }

  async generate(options: ProviderGenerateOptions): Promise<ProviderImageResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("未配置 ALIBAILIAN_API_KEY");
    }

    const model = options.image ? "wanx2.6-t2i" : (MODELS[0].id);
    const size = options.width && options.height
      ? `${options.width}*${options.height}`
      : "1024*1024";

    const body: Record<string, unknown> = {
      model,
      input: {
        prompt: options.prompt,
        ...(options.negativePrompt ? { negative_prompt: options.negativePrompt } : {}),
      },
      parameters: {
        size,
        n: 1,
        ...(options.seed !== undefined ? { seed: options.seed } : {}),
      },
    };

    const startTime = Date.now();

    const createRes = await fetch(API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`创建文生图任务失败: ${createRes.status} ${errText}`);
    }

    const createData = await createRes.json();
    const taskId = createData?.output?.task_id;
    if (!taskId) {
      throw new Error("创建任务未返回 task_id");
    }

    const imageUrl = await pollTask(taskId, apiKey);
    const dataUrl = await downloadAsDataUrl(imageUrl);
    const latency = Date.now() - startTime;

    const modelInfo = MODELS.find((m) => m.id === model);
    const cost = modelInfo?.costPerImage ?? 0.2;

    return {
      imageUrl: dataUrl,
      provider: "alibailian",
      model,
      latency,
      cost,
    };
  }
}
