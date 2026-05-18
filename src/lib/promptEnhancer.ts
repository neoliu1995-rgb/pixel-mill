// 提示词增强引擎

export interface StyleAnalysis {
  style: string;
  colors: string[];
  composition: string;
}

// 默认负向提示词（用于排除不想要的元素）
export const DEFAULT_NEGATIVE_PROMPT = "ugly, blurry, low quality, distorted, disfigured, cartoon, anime, manga, 3d render, watermark, text, signature, bad anatomy, deformed limbs, extra fingers, missing fingers, bad hands";

// 负向提示词分类
const negativePromptCategories = {
  quality: ["low quality", "blurry", "pixelated", "distorted", "ugly", "poorly drawn"],
  artifacts: ["watermark", "text", "signature", "logo", "copyright", "words"],
  anatomy: ["bad anatomy", "deformed limbs", "extra fingers", "missing fingers", "bad hands", "disfigured"],
  style: ["cartoon", "anime", "manga", "comic", "sketch", "line drawing"],
  composition: ["cropped", "cut off", "incomplete", "bad composition"],
};

// 风格预设库
const stylePresets: Record<string, string> = {
  "digital-art": "digital art style, modern digital painting, clean vector graphics",
  "neon-punk": "neon punk, cyberpunk aesthetic, glowing neon lights, futuristic city",
  "line-art": "line art, minimalist drawing, clean lines, black and white",
  "pixel-art": "pixel art, retro game style, 8-bit graphics, nostalgic",
  "photographic": "photorealistic, high detailed photography, professional photo, sharp focus",
  "film-grain": "film grain effect, vintage photo, cinematic film, nostalgic mood",
  "origami": "origami paper art, folded paper style, geometric shapes",
  "3d-model": "3D render, realistic 3D model, CGI, Blender render, cinematic lighting",
  "anime": "anime style, Japanese animation, Studio Ghibli style, vibrant colors",
  "fantasy-art": "fantasy art, magical, mystical, epic fantasy, detailed worldbuilding",
  "low-poly": "low poly 3D style, geometric shapes, modern minimalist",
  "cinematic": "cinematic, movie scene, dramatic lighting, wide angle",
  "comic-book": "comic book style, graphic novel, bold colors, dynamic composition",
  "isometric": "isometric view, 3D perspective, top-down view, architectural",
  "clay-art": "clay art, plasticine, sculpted material, tactile texture",
};

// 质量关键词库
const qualityKeywords = [
  "high quality",
  "highly detailed",
  "professional",
  "masterpiece",
  "sharp focus",
  "vibrant colors",
  "8k resolution",
  "ultra realistic",
  "cinematic lighting",
  "professional photography",
  "ultra detailed",
  "intricate details",
  "stunning",
  "gorgeous",
  "beautiful",
];

// 构图关键词库
const compositionKeywords = [
  "beautiful composition",
  "perfect lighting",
  "artistic composition",
  "golden ratio",
  "rule of thirds",
  "professional composition",
];

// 背景关键词
const backgroundKeywords = [
  "clean background",
  "simple background",
  "professional background",
];

// 分析提示词质量
export const analyzePromptQuality = (prompt: string): number => {
  let score = 0;
  
  // 长度评分
  if (prompt.length >= 50) score += 30;
  else if (prompt.length >= 20) score += 15;
  
  // 包含质量关键词
  const qualityMatches = qualityKeywords.filter(k => prompt.toLowerCase().includes(k));
  score += qualityMatches.length * 10;
  
  // 包含形容词
  const adjectives = ["beautiful", "detailed", "colorful", "vibrant", "elegant", "stunning", "gorgeous"];
  const adjectiveMatches = adjectives.filter(a => prompt.toLowerCase().includes(a));
  score += adjectiveMatches.length * 5;
  
  // 包含风格描述
  const styleMatches = Object.keys(stylePresets).filter(s => prompt.toLowerCase().includes(s.replace("-", " ")));
  score += styleMatches.length * 10;
  
  return Math.min(score, 100);
};

// 自动增强提示词
export const enhancePrompt = (prompt: string, selectedStyle: string = "none"): string => {
  let enhanced = prompt.trim();
  
  // 如果选择了风格，添加风格关键词
  if (selectedStyle !== "none" && stylePresets[selectedStyle]) {
    enhanced = `${stylePresets[selectedStyle]}, ${enhanced}`;
  }
  
  // 分析提示词质量
  const qualityScore = analyzePromptQuality(enhanced);
  
  // 如果质量分数低于70，自动增强（提高阈值）
  if (qualityScore < 70) {
    // 添加更多质量关键词（从4个增加到6个）
    const shuffledKeywords = [...qualityKeywords].sort(() => Math.random() - 0.5);
    const selectedKeywords = shuffledKeywords.slice(0, 6);
    enhanced = `${enhanced}, ${selectedKeywords.join(", ")}`;
    
    // 添加构图关键词
    const compositionShuffled = [...compositionKeywords].sort(() => Math.random() - 0.5);
    enhanced = `${enhanced}, ${compositionShuffled[0]}`;
    
    // 如果提示词中包含"背景"相关词汇，添加背景关键词
    if (enhanced.toLowerCase().includes("background") || 
        enhanced.includes("背景") || 
        enhanced.includes("底色")) {
      const bgShuffled = [...backgroundKeywords].sort(() => Math.random() - 0.5);
      enhanced = `${enhanced}, ${bgShuffled[0]}`;
    }
  }
  
  // 确保提示词中有明确的主体描述
  const hasSubject = enhanced.toLowerCase().match(/(cat|dog|person|woman|man|girl|boy|animal|flower|tree|building|house|car)/);
  if (!hasSubject && !enhanced.toLowerCase().includes("art") && !enhanced.toLowerCase().includes("painting")) {
    // 如果没有明确主体，添加默认高质量描述
    enhanced = `${enhanced}, beautiful artwork, high quality`;
  }
  
  // 移除重复的关键词
  const words = enhanced.split(/\s*,\s*/);
  const uniqueWords = [...new Set(words)];
  enhanced = uniqueWords.join(", ");
  
  return enhanced;
};

// 从参考图提取风格特征（模拟实现）
export const extractImageStyle = (imageDataUrl: string): StyleAnalysis => {
  // 在实际应用中，这里会调用图像分析API
  // 分析颜色、构图、风格等特征
  
  // 模拟返回一个风格分析结果
  const styles = Object.keys(stylePresets);
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  
  return {
    style: stylePresets[randomStyle],
    colors: ["blue", "white", "golden"],
    composition: "centered composition, balanced layout",
  };
};

// 生成提示词建议
export const getPromptSuggestions = (prompt: string): { style: string; details: string } => {
  const suggestions = [
    { style: "digital art style", details: "modern illustration, vibrant colors" },
    { style: "photorealistic", details: "professional photography, sharp focus" },
    { style: "fantasy art", details: "magical atmosphere, epic scenery" },
    { style: "anime style", details: "Japanese animation, Studio Ghibli aesthetic" },
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};
