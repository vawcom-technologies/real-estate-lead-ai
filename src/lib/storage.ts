import { createHmac, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PROPERTY_IMAGES_DIR = path.join(process.cwd(), "property-images");

export type StoredObject = {
  localPath: string;
  remoteUrl: string | null;
  key: string;
};

export function getBeforeImagePath(parcelId: string): string {
  const safeId = sanitizeId(parcelId);
  return path.join(PROPERTY_IMAGES_DIR, `${safeId}.jpg`);
}

export function getAfterImagePath(parcelId: string): string {
  const safeId = sanitizeId(parcelId);
  return path.join(PROPERTY_IMAGES_DIR, `${safeId}_after.jpg`);
}

export function isObjectStorageEnabled(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET?.trim(),
  );
}

function sanitizeId(parcelId: string): string {
  return parcelId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function objectKey(filename: string): string {
  const prefix = process.env.R2_PREFIX?.trim() || "terrace-prospector";
  return `${prefix.replace(/\/$/, "")}/${filename}`;
}

function publicObjectUrl(key: string): string | null {
  const publicBase = process.env.R2_PUBLIC_URL?.trim();
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }
  return null;
}

/** Save locally always; optionally upload to Cloudflare R2 (S3-compatible). */
export async function storeImage(
  filename: string,
  buffer: Buffer,
  contentType = "image/jpeg",
): Promise<StoredObject> {
  await mkdir(PROPERTY_IMAGES_DIR, { recursive: true });
  const localPath = path.join(PROPERTY_IMAGES_DIR, filename);
  await writeFile(localPath, buffer);

  const key = objectKey(filename);
  let remoteUrl: string | null = null;

  if (isObjectStorageEnabled()) {
    remoteUrl = await uploadToR2(key, buffer, contentType);
  }

  return { localPath, remoteUrl, key };
}

export async function storeBeforeImage(
  parcelId: string,
  buffer: Buffer,
): Promise<StoredObject> {
  const safeId = sanitizeId(parcelId);
  return storeImage(`${safeId}.jpg`, buffer);
}

export async function storeAfterImage(
  parcelId: string,
  buffer: Buffer,
): Promise<StoredObject> {
  const safeId = sanitizeId(parcelId);
  return storeImage(`${safeId}_after.jpg`, buffer);
}

async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string | null> {
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!.trim();
  const bucket = process.env.R2_BUCKET!.trim();
  const region = process.env.R2_REGION?.trim() || "auto";

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${bucket}/${key}`;
  const amzDate = new Date()
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    `/${bucket}/${key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, "s3");
  const signature = hmacHex(signingKey, stringToSign);

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      Host: host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`R2 upload failed (${response.status}): ${errorBody}`);
  }

  return publicObjectUrl(key) ?? url;
}

function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function hmacHex(key: Buffer, data: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

function getSignatureKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}
