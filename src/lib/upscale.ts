export interface UpscaleResult {
  imageUrl: string;
  success: boolean;
  originalSize: { width: number; height: number };
  newSize: { width: number; height: number };
}

export const upscaleImage = async (imageDataUrl: string, scale: number = 2): Promise<UpscaleResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageDataUrl;

    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;
      const newWidth = Math.round(originalWidth * scale);
      const newHeight = Math.round(originalHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to create canvas context"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      const upscaledDataUrl = canvas.toDataURL("image/png", 0.95);

      resolve({
        imageUrl: upscaledDataUrl,
        success: true,
        originalSize: { width: originalWidth, height: originalHeight },
        newSize: { width: newWidth, height: newHeight },
      });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
};

export const upscaleWithAI = async (imageDataUrl: string, targetWidth: number, targetHeight: number): Promise<UpscaleResult> => {
  const scale = Math.max(targetWidth / 1024, targetHeight / 1024, 1);
  return upscaleImage(imageDataUrl, scale);
};
