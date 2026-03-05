export interface CompileResult {
  pdf: string;
  pageImages: string[];
  pageCount: number;
}

export async function compileTypst(source: string): Promise<CompileResult> {
  const res = await fetch("/api/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typstSource: source }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Compilation failed" }));
    throw new Error(error.details || error.error || "Typst compilation failed");
  }

  return res.json();
}

export interface CompileWithRetryResult {
  result: CompileResult;
  fixedSource?: string;
}

/**
 * Compile Typst with up to 2 LLM-assisted retries on failure.
 * Returns the compile result and optionally the fixed source if retries were needed.
 */
export async function compileTypstWithRetry(
  source: string,
  maxRetries = 2,
): Promise<CompileWithRetryResult> {
  let currentSource = source;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await compileTypst(currentSource);
      return {
        result,
        fixedSource: currentSource !== source ? currentSource : undefined,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Compilation failed";

      if (attempt < maxRetries) {
        try {
          const fixRes = await fetch("/api/fix-typst", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ typstSource: currentSource, compileError: lastError }),
          });

          if (fixRes.ok) {
            const fixData = await fixRes.json();
            if (fixData.typstSource) {
              currentSource = fixData.typstSource;
              continue;
            }
          }
        } catch {
          // fix-typst endpoint unavailable (demo mode), skip retry
        }
      }
    }
  }

  throw new Error(lastError || "Typst compilation failed after retries");
}

/**
 * Escape unescaped $ signs that precede digits (currency like $120K, $5M).
 * This is the only realistic $ usage in resumes; avoids breaking Typst math mode.
 */
export function sanitizeTypstSource(source: string): string {
  return source.replace(/(?<!\\)\$(?=\d)/g, "\\$");
}

export function pdfBase64ToUint8Array(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}
