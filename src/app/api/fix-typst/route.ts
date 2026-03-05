import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { typstSource, compileError } = await request.json();

    if (!typstSource || !compileError) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hasAzure = process.env.AZURE_RESOURCE_NAME && process.env.AZURE_API_KEY;

    if (!hasAzure) {
      return NextResponse.json({ error: "Azure AI not configured" }, { status: 503 });
    }

    const { generateText } = await import("ai");
    const { getModel } = await import("@/lib/ai");

    const result = await generateText({
      model: getModel(),
      messages: [
        {
          role: "user",
          content: `The following Typst resume source code failed to compile. Fix the error and return ONLY the corrected complete Typst source code, with no explanation or markdown fences.

## Compile Error:
${compileError}

## Typst Source:
${typstSource}`,
        },
      ],
    });

    let fixed = result.text;
    fixed = fixed.replace(/^```typst\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");

    return NextResponse.json({ typstSource: fixed });
  } catch (error) {
    console.error("Fix-typst error:", error);
    return NextResponse.json({ error: "Failed to fix Typst" }, { status: 500 });
  }
}
