export interface PromptPreset {
  id: string;
  name: string;
  category: string;
  prompt: string;
  thumbnail?: string;
}

export const promptPresets: PromptPreset[] = [
  {
    id: "cinematic-landscape",
    name: "电影级风景",
    category: "风景",
    prompt: "cinematic landscape photography, epic mountain range at sunset, dramatic lighting, golden hour, photorealistic, ultra detailed, 8K, sharp focus"
  },
  {
    id: "anime-character",
    name: "动漫角色",
    category: "人物",
    prompt: "anime style character portrait, beautiful girl with long flowing hair, big expressive eyes, colorful outfit, studio Ghibli style, soft colors, detailed background"
  },
  {
    id: "cyberpunk-city",
    name: "赛博朋克城市",
    category: "场景",
    prompt: "cyberpunk city at night, neon lights, futuristic architecture, rain reflections, Blade Runner style, ultra detailed, cinematic, moody atmosphere"
  },
  {
    id: "fantasy-dragon",
    name: "幻想巨龙",
    category: "幻想",
    prompt: "majestic fantasy dragon, scales shimmering like gemstones, flying over medieval castle, dramatic clouds, magical lighting, epic fantasy art"
  },
  {
    id: "cute-animals",
    name: "可爱动物",
    category: "动物",
    prompt: "cute fluffy kitten playing with yarn, soft focus background, warm lighting, adorable expression, high quality photography, professional studio lighting"
  },
  {
    id: "vintage-portrait",
    name: "复古肖像",
    category: "人物",
    prompt: "vintage portrait photography, elegant woman in 1920s dress, soft natural light, film grain, classic style, timeless beauty"
  },
  {
    id: "underwater-world",
    name: "海底世界",
    category: "场景",
    prompt: "underwater scene with colorful coral reef, tropical fish swimming, sunlight filtering through water, vibrant colors, peaceful atmosphere, photorealistic"
  },
  {
    id: "steampunk-machine",
    name: "蒸汽朋克机械",
    category: "幻想",
    prompt: "intricate steampunk machine, brass gears and pipes, Victorian era design, detailed mechanical parts, warm sepia tones, cinematic lighting"
  },
  {
    id: "space-exploration",
    name: "太空探索",
    category: "科幻",
    prompt: "dramatic space scene, astronaut floating near colorful nebula, stars and galaxies, cinematic lighting, ultra realistic, NASA style photography"
  },
  {
    id: "food-photography",
    name: "美食摄影",
    category: "静物",
    prompt: "professional food photography, delicious gourmet meal on elegant plate, soft natural lighting, steam rising, appetizing, ultra detailed, bokeh background"
  },
  {
    id: "forest-fairy",
    name: "森林精灵",
    category: "幻想",
    prompt: "magical forest fairy with translucent wings, standing among glowing mushrooms, enchanted forest, soft magical lighting, ethereal atmosphere"
  },
  {
    id: "sports-action",
    name: "运动瞬间",
    category: "动态",
    prompt: "dynamic sports photography, athlete in mid-action, frozen motion, dramatic lighting, powerful composition, professional sports photography"
  }
];

export const presetCategories = [...new Set(promptPresets.map(p => p.category))];

export const getPresetsByCategory = (category: string): PromptPreset[] => {
  if (!category || category === "全部") {
    return promptPresets;
  }
  return promptPresets.filter(p => p.category === category);
};
