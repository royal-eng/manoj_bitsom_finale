export async function prepareImage(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw Error("Choose a PNG, JPEG or WebP image.");
  if (file.size > 8 * 1024 * 1024)
    throw Error("Choose an image smaller than 8 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw Error("Image processing unavailable.");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { default: jsQR } = await import("jsqr");
  const qr = jsQR(pixels.data, pixels.width, pixels.height, {
    inversionAttempts: "attemptBoth",
  });
  const image = canvas.toDataURL("image/jpeg", 0.85);
  if (image.length > 2200000)
    throw Error("Crop the image to the message and try again.");
  return { image, qrPayload: qr?.data || "" };
}
