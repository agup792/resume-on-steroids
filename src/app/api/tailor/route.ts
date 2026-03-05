import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { typstSource, jdUrl } = await request.json();

    if (!typstSource || !jdUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hasAzure = process.env.AZURE_RESOURCE_NAME && process.env.AZURE_API_KEY;

    if (hasAzure) {
      try {
        const cheerio = await import("cheerio");
        const { generateText } = await import("ai");
        const { getModel } = await import("@/lib/ai");
        const { RUBRIC_CREATION_PROMPT, TAILORING_PROMPT } = await import("@/lib/prompts");

        // Step 1: Scrape JD
        const response = await fetch(jdUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ResumeBuilder/1.0)",
          },
        });

        if (!response.ok) {
          return NextResponse.json({
            error: "Could not access that URL. Try pasting the job description text directly.",
          });
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        $("script, style, nav, footer, header").remove();
        const jdText = $("body").text().replace(/\s+/g, " ").trim();

        if (jdText.length < 100) {
          return NextResponse.json({
            error: "Could not extract a job description from that page. Try a direct job posting link.",
          });
        }

        // Step 2: Create rubric
        const rubricResult = await generateText({
          model: getModel(),
          messages: [{ role: "user", content: RUBRIC_CREATION_PROMPT + "\n\n" + jdText }],
        });

        // Step 3: Tailor CV
        const tailorResult = await generateText({
          model: getModel(),
          messages: [
            {
              role: "user",
              content: `${TAILORING_PROMPT}\n\n## Original Resume (Typst):\n\`\`\`typst\n${typstSource}\n\`\`\`\n\n## Scoring Rubric:\n${rubricResult.text}\n\n## Job Description:\n${jdText}`,
            },
          ],
        });

        let tailoredSource = tailorResult.text;
        tailoredSource = tailoredSource
          .replace(/^```typst\n?/, "")
          .replace(/^```\n?/, "")
          .replace(/\n?```$/, "");

        // Extract title from page
        const pageTitle = $("title").text() || "Tailored Resume";
        const variantName = pageTitle.slice(0, 40);

        return NextResponse.json({
          typstSource: tailoredSource,
          variantName,
          rubric: rubricResult.text,
        });
      } catch (aiError) {
        console.error("Azure AI tailoring failed:", aiError);
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
