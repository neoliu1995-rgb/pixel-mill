import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { logger } from "@/lib/logger";

function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
}

function isR2Configured(): boolean {
  const c = getR2Config();
  return !!(c.accountId && c.accessKeyId && c.secretAccessKey && c.bucketName);
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const c = getR2Config();
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: c.accessKeyId!,
        secretAccessKey: c.secretAccessKey!,
      },
    });
  }
  return s3Client;
}

function parseBase64Data(base64Data: string): { mimeType: string; ext: string; data: string } {
  const dataUrlMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1];
    const data = dataUrlMatch[2];
    const ext = mimeTypeToExt(mimeType);
    return { mimeType, ext, data };
  }
  return { mimeType: "image/png", ext: "png", data: base64Data };
}

function mimeTypeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[mimeType] || "png";
}

function generateKey(userId?: string, ext: string = "png"): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
  const uuid = randomUUID();
  const userPart = userId || "anonymous";
  return `pixelmill/${userPart}/${date}/${uuid}.${ext}`;
}

export function getPublicUrl(key: string): string {
  const c = getR2Config();
  if (c.publicUrl) {
    return `${c.publicUrl.replace(/\/$/, "")}/${key}`;
  }
  return `https://${c.bucketName}.${c.accountId}.r2.cloudflarestorage.com/${key}`;
}

export async function uploadImage(
  base64Data: string,
  userId?: string,
  key?: string
): Promise<string> {
  if (!isR2Configured()) {
    return base64Data;
  }

  try {
    const { mimeType, ext, data } = parseBase64Data(base64Data);
    const objectKey = key || generateKey(userId, ext);
    const buffer = Buffer.from(data, "base64");

    const client = getS3Client();
    const c = getR2Config();
    await client.send(
      new PutObjectCommand({
        Bucket: c.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    return getPublicUrl(objectKey);
  } catch (error) {
    logger.error("R2 upload failed:", { error });
    return base64Data;
  }
}

export async function deleteImage(key: string): Promise<void> {
  if (!isR2Configured()) {
    return;
  }

  try {
    const client = getS3Client();
    const c = getR2Config();
    await client.send(
      new DeleteObjectCommand({
        Bucket: c.bucketName,
        Key: key,
      })
    );
  } catch (error) {
    logger.error("R2 delete failed:", { error });
  }
}
