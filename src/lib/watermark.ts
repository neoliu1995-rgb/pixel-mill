import sharp from "sharp";

export async function addWatermark(imageDataUrl: string): Promise<string> {
  const matches = imageDataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches) return imageDataUrl;

  const format = matches[1];
  const base64Data = matches[2];
  const imageBuffer = Buffer.from(base64Data, "base64");

  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  const fontSize = Math.max(16, Math.round(width * 0.035));
  const watermarkText = "PixelMill ✨";
  const textWidth = Math.round(watermarkText.length * fontSize * 0.6);
  const textHeight = Math.round(fontSize * 1.5);
  const paddingX = Math.round(width * 0.05);
  const paddingY = Math.round(height * 0.05);

  const svgWidth = textWidth + 20;
  const svgHeight = textHeight + 10;

  const svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
  </defs>
  <style>
    @font-face { font-family: 'WatermarkFont'; src: local('Arial'), local('Helvetica'), local('sans-serif'); }
  </style>
  <text x="10" y="${fontSize + 5}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600" fill="rgba(255,255,255,0.4)" filter="url(#shadow)">${watermarkText}</text>
</svg>`;

  const svgBuffer = Buffer.from(svg);

  const outputFormat = format === "png" ? "png" : format === "webp" ? "webp" : "jpeg";
  const outputOptions = outputFormat === "jpeg" ? { quality: 90 } : outputFormat === "png" ? { compressionLevel: 6 } : { quality: 90 };

  const watermarkedBuffer = await sharp(imageBuffer)
    .composite([{
      input: svgBuffer,
      top: height - svgHeight - paddingY,
      left: width - svgWidth - paddingX,
    }])
    [outputFormat](outputOptions)
    .toBuffer();

  const outputBase64 = watermarkedBuffer.toString("base64");
  return `data:image/${outputFormat};base64,${outputBase64}`;
}
