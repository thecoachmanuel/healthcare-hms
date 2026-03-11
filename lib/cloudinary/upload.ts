export async function uploadToCloudinary(file: File, folder?: string) {
  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  if (!signRes.ok) {
    const data = await signRes.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to get upload signature");
  }

  const signed = (await signRes.json()) as {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  if (signed.folder) {
    formData.append("folder", signed.folder);
  }

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const uploadData = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(uploadData?.error?.message ?? "Upload failed");
  }

  const url = uploadData?.secure_url as string | undefined;
  if (!url) {
    throw new Error("Upload succeeded but no URL returned");
  }

  return url;
}
