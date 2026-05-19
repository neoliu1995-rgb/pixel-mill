import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
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
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
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
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    return getPublicUrl(objectKey);
  } catch (error) {
    console.error("R2 upload failed:", error);
    return base64Data;
  }
}

export async function deleteImage(key: string): Promise<void> {
  if (!isR2Configured()) {
    return;
  }

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error("R2 delete failed:", error);
  }
}
