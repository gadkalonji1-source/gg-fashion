export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Lecture image impossible"));
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(file: File, maxSize = 1400, quality = 0.72): Promise<string> {
  const raw = await readFileAsDataUrl(file);
  if (!raw) return "";

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Image invalide"));
    element.src = raw;
  });

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return raw;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function filesToCompressedDataUrls(files: FileList | File[] | null) {
  if (!files) return [];
  const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
  const urls = await Promise.all(list.map((file) => compressImageFile(file)));
  return urls.filter(Boolean);
}
