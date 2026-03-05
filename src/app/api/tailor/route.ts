import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { typstSource, jdUrl, jdText: rawJdText } = await request.json();

    if (!typstSource || (!jdUrl && !rawJdText)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hasAzure = process.env.AZURE_RESOURCE_NAME && process.env.AZURE_API_KEY;

    if (hasAzure) {
      try {
        const { generateText } = await import("ai");
        const { getModel } = await import("@/lib/ai");
        const { RUBRIC_CREATION_PROMPT, TAILORING_PROMPT } = await import("@/lib/prompts");

        let jdText: string;
        let variantLabel: string;

        if (rawJdText) {
          jdText = rawJdText.replace(/\s+/g, " ").trim();
          variantLabel = "Tailored Resume";
        } else {
          const cheerio = await import("cheerio");

          let response: Response;
          try {
            response = await fetch(jdUrl, {
              headers: { "User-Agent": "Mozilla/5.0 (compatible; ResumeBuilder/1.0)" },
              signal: AbortSignal.timeout(15000),
            });
          } catch {
            return NextResponse.json({
              error: "Couldn't access that URL — it may be blocked or unreachable. Try pasting the job description text directly after /tailor.",
            });
          }

          if (!response.ok) {
            return NextResponse.json({
              error: `Couldn't access that URL (HTTP ${response.status}). Try pasting the job description text directly after /tailor.`,
            });
          }

          const html = await response.text();
          const $ = cheerio.load(html);
          $("script, style, nav, footer, header, iframe, noscript").remove();
          jdText = $("body").text().replace(/\s+/g, " ").trim();
          variantLabel = $("title").text() || "Tailored Resume";

          if (jdText.length < 100) {
            return NextResponse.json({
              error: "Couldn't find a job description on that page. Try a direct job posting link, or paste the job description text directly after /tailor.",
            });
          }
        }

        if (jdText.length < 50) {
          return NextResponse.json({
            error: "The job description seems too short. Please provide more details about the role.",
          });
        }

        const rubricResult = await generateText({
          model: getModel(),
          messages: [{ role: "user", content: RUBRIC_CREATION_PROMPT + "\n\n" + jdText.slice(0, 8000) }],
        });

        const tailorResult = await generateText({
          model: getModel(),
          messages: [
            {
              role: "user",
              content: `${TAILORING_PROMPT}\n\n## Original Resume (Typst):\n\`\`\`typst\n${typstSource}\n\`\`\`\n\n## Scoring Rubric:\n${rubricResult.text}\n\n## Job Description:\n${jdText.slice(0, 8000)}`,
            },
          ],
        });

        let tailoredSource = tailorResult.text;
        tailoredSource = tailoredSource
          .replace(/^```typst\n?/, "")
          .replace(/^```\n?/, "")
          .replace(/\n?```$/, "");

        const variantName = variantLabel.slice(0, 40);

        return NextResponse.json({
          typstSource: tailoredSource,
          variantName,
          rubric: rubricResult.text,
        });
      } catch (aiError) {
        console.error("Azure AI tailoring failed:", aiError);
        return NextResponse.json({
          error: "The AI service encountered an error while tailoring. Please try again.",
        });
      }
    }

    // Demo mode
    await new Promise((r) => setTimeout(r, 2000));

    return NextResponse.json({
      typstSource: typstSource,
      variantName: "Demo — Tailored Variant",
      rubric: "Demo rubric (connect Azure AI for real tailoring)",
    });
  } catch (error) {
    console.error("Tailor error:", error);
    return NextResponse.json({ error: "Failed to tailor resume" }, { status: 500 });
  }
}
