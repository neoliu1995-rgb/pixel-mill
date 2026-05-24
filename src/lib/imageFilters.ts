type FilterConfig = {
  sepia?: number;
  contrast?: number;
  brightness?: number;
  saturate?: number;
  hueRotate?: number;
  blur?: number;
  grain?: number;
  vignette?: number;
  lightLeak?: boolean;
  posterize?: number;
  edgeDetect?: boolean;
  edgeColor?: string;
  edgeThickness?: number;
  colorShift?: { r: number; g: number; b: number };
  scanlines?: boolean;
  fade?: number;
};

const FILTER_PRESETS: Record<string, FilterConfig> = {
  "retro-film": {
    sepia: 0.45,
    contrast: 1.15,
    brightness: 0.95,
    saturate: 0.75,
    grain: 0.08,
    vignette: 0.6,
    lightLeak: true,
    fade: 0.1,
    colorShift: { r: 15, g: 5, b: -10 },
    scanlines: false,
  },
  caricature: {
    contrast: 1.5,
    brightness: 1.1,
    saturate: 1.8,
    posterize: 6,
    edgeDetect: true,
    edgeColor: "#1a1a2e",
    edgeThickness: 1,
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function addGrain(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * intensity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

function addVignette(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.3,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function addLightLeak(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createRadialGradient(
    width * 0.85, height * 0.15, 0,
    width * 0.85, height * 0.15, Math.max(width, height) * 0.5
  );
  gradient.addColorStop(0, "rgba(255,220,100,0.25)");
  gradient.addColorStop(0.4, "rgba(255,180,60,0.1)");
  gradient.addColorStop(1, "rgba(255,150,50,0)");
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
}

function applyColorShift(ctx: CanvasRenderingContext2D, width: number, height: number, shift: { r: number; g: number; b: number }) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + shift.r));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + shift.g));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + shift.b));
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyFade(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  ctx.fillStyle = `rgba(255,255,240,${intensity})`;
  ctx.fillRect(0, 0, width, height);
}

function addScanlines(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "rgba(0,0,0,0.03)";
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }
}

function posterize(ctx: CanvasRenderingContext2D, width: number, height: number, levels: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / step) * step);
    data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
  }
  ctx.putImageData(imageData, 0, 0);
}

function edgeDetectAndOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  edgeColor: string,
  thickness: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const gray = new Float32Array(width * height);

  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
  }

  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
        -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
        -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
      const gy =
        -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  let maxEdge = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > maxEdge) maxEdge = edges[i];
  }
  if (maxEdge === 0) maxEdge = 1;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.drawImage(ctx.canvas, 0, 0);

  const resultData = ctx.getImageData(0, 0, width, height);
  const result = resultData.data;

  const edgeR = parseInt(edgeColor.slice(1, 3), 16);
  const edgeG = parseInt(edgeColor.slice(3, 5), 16);
  const edgeB = parseInt(edgeColor.slice(5, 7), 16);

  const threshold = 0.15;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const normalizedEdge = edges[idx] / maxEdge;

      if (normalizedEdge > threshold) {
        const pixIdx = idx * 4;
        const blend = Math.min(1, (normalizedEdge - threshold) / (1 - threshold)) * 0.9;
        result[pixIdx] = Math.round(result[pixIdx] * (1 - blend) + edgeR * blend);
        result[pixIdx + 1] = Math.round(result[pixIdx + 1] * (1 - blend) + edgeG * blend);
        result[pixIdx + 2] = Math.round(result[pixIdx + 2] * (1 - blend) + edgeB * blend);
      }
    }
  }

  ctx.putImageData(resultData, 0, 0);
}

export async function applyFilter(
  imageSrc: string,
  effectId: string
): Promise<string> {
  const config = FILTER_PRESETS[effectId];
  if (!config) {
    throw new Error(`Unknown filter effect: ${effectId}`);
  }

  const img = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d")!;

  const cssFilters: string[] = [];
  if (config.sepia) cssFilters.push(`sepia(${config.sepia})`);
  if (config.contrast) cssFilters.push(`contrast(${config.contrast})`);
  if (config.brightness) cssFilters.push(`brightness(${config.brightness})`);
  if (config.saturate) cssFilters.push(`saturate(${config.saturate})`);
  if (config.hueRotate) cssFilters.push(`hue-rotate(${config.hueRotate}deg)`);
  if (config.blur) cssFilters.push(`blur(${config.blur}px)`);

  if (cssFilters.length > 0) {
    ctx.filter = cssFilters.join(" ");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.filter = "none";

  if (config.colorShift) {
    applyColorShift(ctx, canvas.width, canvas.height, config.colorShift);
  }

  if (config.posterize) {
    posterize(ctx, canvas.width, canvas.height, config.posterize);
  }

  if (config.edgeDetect) {
    edgeDetectAndOverlay(
      ctx,
      canvas.width,
      canvas.height,
      config.edgeColor || "#000000",
      config.edgeThickness || 1
    );
  }

  if (config.grain) {
    addGrain(ctx, canvas.width, canvas.height, config.grain);
  }

  if (config.vignette) {
    addVignette(ctx, canvas.width, canvas.height, config.vignette);
  }

  if (config.lightLeak) {
    addLightLeak(ctx, canvas.width, canvas.height);
  }

  if (config.fade) {
    applyFade(ctx, canvas.width, canvas.height, config.fade);
  }

  if (config.scanlines) {
    addScanlines(ctx, canvas.width, canvas.height);
  }

  return canvas.toDataURL("image/png");
}

export function isFilterEffect(effectId: string): boolean {
  return effectId in FILTER_PRESETS;
}
