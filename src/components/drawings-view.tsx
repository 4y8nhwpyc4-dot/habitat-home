import { useEffect, useRef, useState } from "react";
import { FileImage, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DRAWING_ACCEPT,
  clearDrawingFile,
  drawingKind,
  formatBytes,
  loadDrawingFile,
  saveDrawingFile,
  validateDrawingFile,
} from "@/lib/drawing";
import { usePlanStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function DrawingsView() {
  const meta = usePlanStore((s) => s.drawing);
  const setDrawing = usePlanStore((s) => s.setDrawing);
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!meta) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    loadDrawingFile()
      .then((record) => {
        if (cancelled || !record) return;
        objectUrl = URL.createObjectURL(record.blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError("Could not open the saved drawing on this device.");
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [meta]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const problem = validateDrawingFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await saveDrawingFile(file);
      setDrawing(next);
    } catch {
      setError("Could not save the drawing on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    try {
      await clearDrawingFile();
      setDrawing(null);
      setUrl(null);
    } catch {
      setError("Could not remove the drawing.");
    } finally {
      setBusy(false);
    }
  }

  const kind = meta ? drawingKind(meta.type, meta.name) : null;

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Floor plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Drop the lot’s drawing here — PDF or a photo of the plan. It stays on
            this device until you replace it. The south elevation in the header
            still tracks build progress.
          </p>
        </div>
        {meta ? (
          <div className="flex flex-wrap gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={onRemove}>
              Remove
            </Button>
          </div>
        ) : null}
      </header>

      <input
        ref={inputRef}
        type="file"
        accept={DRAWING_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />

      {meta && url ? (
        <figure className="overflow-hidden rounded-lg border border-border bg-muted/40">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-3 py-2 font-mono text-[11px] tracking-wide text-muted-foreground">
            <span className="truncate">{meta.name}</span>
            <span>
              {formatBytes(meta.size)}
              <span className="mx-2 text-rule">·</span>
              {kind === "pdf" ? "PDF" : "Image"}
            </span>
          </figcaption>
          {kind === "pdf" ? (
            <iframe
              title={meta.name}
              src={url}
              className="h-[min(80dvh,52rem)] w-full bg-card"
            />
          ) : (
            <div className="flex min-h-72 items-center justify-center p-3">
              <img
                src={url}
                alt={meta.name}
                className="max-h-[min(80dvh,52rem)] w-full object-contain"
              />
            </div>
          )}
        </figure>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void onFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex min-h-72 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-[background-color,border-color]",
            drag
              ? "border-primary bg-accent"
              : "border-border bg-muted/40 hover:bg-muted",
          )}
        >
          {busy ? (
            <span className="text-sm text-muted-foreground">Saving…</span>
          ) : (
            <>
              <span className="flex size-12 items-center justify-center rounded-full bg-card text-foreground">
                {drag ? <Upload className="size-5" /> : <FileImage className="size-5" />}
              </span>
              <span className="text-sm font-medium">
                Drop a floor plan PDF or photo
              </span>
              <span className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                PNG, JPG, WebP, GIF, or PDF up to 12 MB. This is the sheet you
                build from — not a substitute for stamped drawings.
              </span>
            </>
          )}
        </button>
      )}

      {error ? (
        <p className="mt-3 text-sm text-warn" role="status">
          {error}
        </p>
      ) : null}
    </section>
  );
}
