import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, unlink, mkdir, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";
import { existsSync } from "fs";

const execFileAsync = promisify(execFile);

function getTypstPath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const localBin = join(homeDir, ".local", "bin", "typst");
  if (existsSync(localBin)) return localBin;
  return "typst";
}

export async function POST(request: NextRequest) {
  const id = randomUUID();
  const workDir = join(tmpdir(), `typst-${id}`);
  const inputPath = join(workDir, "main.typ");
  const pdfPath = join(workDir, "output.pdf");
  const pngPattern = join(workDir, "page-{p}.png");

  try {
    const { typstSource } = await request.json();

    if (!typstSource) {
      return NextResponse.json({ error: "No Typst source provided" }, { status: 400 });
    }

    await mkdir(workDir, { recursive: true });
    await writeFile(inputPath, typstSource, "utf-8");

    const typstPath = getTypstPath();

    // Compile to PDF (for download)
    await execFileAsync(typstPath, ["compile", inputPath, pdfPath], {
      timeout: 30000,
    });

    // Compile to PNG (for preview)
    await execFileAsync(typstPath, ["compile", "--format", "png", inputPath, pngPattern], {
      timeout: 30000,
    });

    const pdfBytes = await readFile(pdfPath);
    const pdfBase64 = pdfBytes.toString("base64");

    // Read all generated PNG files
    const files = await readdir(workDir);
    const pngFiles = files.filter((f) => f.startsWith("page-") && f.endsWith(".png")).sort();
    const pageImages: string[] = [];

    for (const pngFile of pngFiles) {
      const pngBytes = await readFile(join(workDir, pngFile));
      pageImages.push(`data:image/png;base64,${pngBytes.toString("base64")}`);
    }

    // Cleanup
    const cleanupFiles = [inputPath, pdfPath, ...pngFiles.map((f) => join(workDir, f))];
    await Promise.all(cleanupFiles.map((f) => unlink(f).catch(() => {})));

    return NextResponse.json({
      pdf: pdfBase64,
      pageImages,
      pageCount: pageImages.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compilation failed";
    console.error("Typst compilation error:", message);

    return NextResponse.json(
      { error: "Typst compilation failed", details: message },
      { status: 500 }
    );
  }
}
