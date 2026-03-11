import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary env vars are missing" },
      { status: 500 }
    );
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {}

  const folder =
    (typeof body === "object" && body && "folder" in body
      ? (body as { folder?: string }).folder
      : undefined) ??
    process.env.CLOUDINARY_UPLOAD_FOLDER ??
    "hms";

  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  };

  const signatureBase = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(signatureBase + apiSecret)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
  });
}
