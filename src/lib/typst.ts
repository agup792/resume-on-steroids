export interface CompileResult {
  pdf: string;        // base64-encoded PDF
  pageImages: string[]; // data:image/png;base64,... for each page
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

export function pdfBase64ToUint8Array(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}
