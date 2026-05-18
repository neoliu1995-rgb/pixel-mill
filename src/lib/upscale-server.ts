export async function upscaleWithCanvas(imageDataUrl: string, scale: number = 2): Promise<string> {
  const response = await fetch(imageDataUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  const { default: sharp } = await import("sharp");
  const metadata = await sharp(buffer).metadata();
  const origWidth = metadata.width || 512;
  const origHeight = metadata.height || 512;

  const resized = await sharp(buffer)
    .resize(origWidth * scale, origHeight * scale, {
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  return `data:image/png;base64,${resized.toString("base64")}`;
}
