import {
  ImageEditProvider,
  ProviderImageResult,
} from "./base";

const API_BASE = "https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis";
const TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks/";
const MODEL = "wanx2.1-imageedit";
const COST_PER_IMAGE = 0.14;
const POLL_INTERVAL = 2000;
const MAX_POLL_TIME = 60000;

function getApiKey(): string | undefined {
  return process.env.ALIBAILIAN_API_KEY;
}

async function submitTask(apiKey: string, imageUrl: string, prompt: string): Promise<string> {
  const body = {
    model: MODEL,
    input: {
      image_url: imageUrl,
      prompt,
    },
    parameters: {
      n: 1,
    },
  };

  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`创建图像编辑任务失败: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const taskId = data?.output?.task_id;
  if (!taskId) {
    throw new Error("创建任务未返回 task_id");
  }
  return taskId;
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
  throw new Error("任务超时，超过60秒未完成");
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

async function executeEdit(imageUrl: string, prompt: string): Promise<ProviderImageResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("未配置 ALIBAILIAN_API_KEY");
  }

  const startTime = Date.now();
  const taskId = await submitTask(apiKey, imageUrl, prompt);
  const resultUrl = await pollTask(taskId, apiKey);
  const dataUrl = await downloadAsDataUrl(resultUrl);
  const latency = Date.now() - startTime;

  return {
    imageUrl: dataUrl,
    provider: "alibailian",
    model: MODEL,
    latency,
    cost: COST_PER_IMAGE,
  };
}

export class AliBailianEditProvider implements ImageEditProvider {
  name = "alibailian-edit";

  isAvailable(): boolean {
    return !!getApiKey();
  }

  async removeBackground(imageUrl: string): Promise<ProviderImageResult> {
    return executeEdit(imageUrl, "去除背景");
  }

  async replaceBackground(imageUrl: string, bgColor: string): Promise<ProviderImageResult> {
    return executeEdit(imageUrl, `将背景替换为${bgColor}`);
  }

  async upscale(imageUrl: string, _scale: 2 | 4): Promise<ProviderImageResult> {
    return executeEdit(imageUrl, "图像超分");
  }
}
