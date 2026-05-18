import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildPollinationsUrl(
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  model: string = "flux"
): string {
  const enhancedPrompt = `${prompt}, high quality, detailed, professional`;
  const encoded = encodeURIComponent(enhancedPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true`;
}

export const ASPECT_RATIOS = [
  { label: "1:1", width: 1024, height: 1024, description: "Square" },
  { label: "16:9", width: 1280, height: 720, description: "Landscape" },
  { label: "9:16", width: 720, height: 1280, description: "Portrait" },
  { label: "4:3", width: 1024, height: 768, description: "Standard" },
];

export const STYLE_PRESETS = [
  { id: "none", label: "无", description: "无风格" },
  { id: "digital-art", label: "数字艺术", description: "Digital art" },
  { id: "neon-punk", label: "霓虹朋克", description: "Neon punk" },
  { id: "line-art", label: "线条艺术", description: "Line art" },
  { id: "pixel-art", label: "像素艺术", description: "Pixel art" },
  { id: "photographic", label: "摄影写实", description: "Realistic photo" },
  { id: "film-grain", label: "胶片感", description: "Film grain" },
  { id: "origami", label: "折纸", description: "Origami" },
  { id: "3d-model", label: "3D模型", description: "3D model" },
  { id: "anime", label: "动漫", description: "Japanese anime" },
  { id: "fantasy-art", label: "奇幻艺术", description: "Fantasy art" },
  { id: "low-poly", label: "低多边形", description: "Low poly" },
  { id: "cinematic", label: "电影感", description: "Cinematic" },
  { id: "comic-book", label: "漫画书", description: "Comic book" },
  { id: "isometric", label: "等距视角", description: "Isometric" },
  { id: "clay-art", label: "粘土工艺", description: "Clay art" },
];

export const ADVANCED_OPTIONS = [
  { id: "no-color", label: "无色彩", description: "Black and white" },
  { id: "no-light", label: "无光照", description: "Flat lighting" },
  { id: "no-composition", label: "无构图", description: "Simple composition" },
];

export const SAMPLE_PROMPTS = [
  "A majestic dragon flying over a mystical mountain range at sunset",
  "A cozy coffee shop interior with warm lighting and vintage decor",
  "Futuristic cityscape with flying cars and neon lights",
  "A serene Japanese garden with cherry blossoms and a koi pond",
  "An astronaut floating in space with Earth in the background",
  "A magical forest with glowing mushrooms and fireflies",
  "Luxury sports car on a winding mountain road",
  "A cozy cabin in the snowy mountains with smoke from chimney",
  "An underwater scene with coral reef and colorful fish",
  "A steampunk inventor's workshop with gears and brass instruments",
];
