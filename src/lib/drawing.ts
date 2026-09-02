export type DrawingMeta = {
  name: string;
  type: string;
  size: number;
  savedAt: number;
};

export type DrawingRecord = DrawingMeta & { blob: Blob };

const DB_NAME = "cedar-lot";
const STORE = "drawings";
const KEY = "floorplan";

export const DRAWING_MAX_BYTES = 12 * 1024 * 1024;

export const DRAWING_ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,image/gif";

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isPdfName(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

function isImageName(name: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

export function drawingKind(type: string, name = "") {
  if (type === "application/pdf" || isPdfName(name)) return "pdf" as const;
  if (type.startsWith("image/") || isImageName(name)) return "image" as const;
  return "unknown" as const;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateDrawingFile(file: File) {
  const type = file.type || (isPdfName(file.name) ? "application/pdf" : "");
  if (file.size > DRAWING_MAX_BYTES) {
    return `Keep the file under ${formatBytes(DRAWING_MAX_BYTES)}.`;
  }
  if (!ALLOWED.has(type) && drawingKind(type, file.name) === "unknown") {
    return "Use a PDF or a PNG, JPG, WebP, or GIF photo.";
  }
  return null;
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function saveDrawingFile(file: File): Promise<DrawingMeta> {
  const type =
    file.type ||
    (isPdfName(file.name) ? "application/pdf" : "application/octet-stream");
  const record: DrawingRecord = {
    name: file.name,
    type,
    size: file.size,
    savedAt: Date.now(),
    blob: file.slice(0, file.size, type),
  };
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Save failed"));
    });
  } finally {
    db.close();
  }
  return {
    name: record.name,
    type: record.type,
    size: record.size,
    savedAt: record.savedAt,
  };
}

export async function loadDrawingFile(): Promise<DrawingRecord | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as DrawingRecord | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("Load failed"));
    });
  } finally {
    db.close();
  }
}

export async function clearDrawingFile() {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Clear failed"));
    });
  } finally {
    db.close();
  }
}
