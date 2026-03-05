import { NextRequest, NextResponse } from "next/server";

const SAMPLE_TYPST = `#import "@preview/basic-resume:0.2.9": *

#show: resume.with(
  author: "Jane Smith",
  location: "San Francisco, CA",
  email: "jane.smith@email.com",
  github: "github.com/janesmith",
  linkedin: "linkedin.com/in/janesmith",
  phone: "+1 (555) 123-4567",
  accent-color: "#26428b",
  font: "New Computer Modern",
  paper: "us-letter",
)

== Education

#edu(
  institution: "Stanford University",
  location: "Stanford, CA",
  dates: dates-helper(start-date: "Sep 2015", end-date: "Jun 2019"),
  degree: "Bachelor of Science, Computer Science",
)

- Dean's List all quarters
- Coursework: Machine Learning, Distributed Systems, Database Systems

== Work Experience

#work(
  title: "Senior Software Engineer",
  location: "San Francisco, CA",
  company: "TechCorp Inc.",
  dates: dates-helper(start-date: "Jul 2021", end-date: "Present"),
)

- Led migration of monolithic API to microservices architecture, reducing deployment time by 60%
- Built real-time data pipeline processing 2M+ events/day using Kafka and Apache Flink
- Mentored 4 junior engineers through structured code review and pair programming sessions

#work(
  title: "Software Engineer",
  location: "Mountain View, CA",
  company: "StartupXYZ",
  dates: dates-helper(start-date: "Aug 2019", end-date: "Jun 2021"),
)

- Developed customer-facing dashboard with React and TypeScript, serving 50K+ monthly users
- Implemented CI/CD pipeline with GitHub Actions, reducing release cycle from 2 weeks to daily
- Optimized PostgreSQL queries resulting in 40% faster page load times

== Projects

#project(
  name: "Open Source Contribution — Kubernetes",
  dates: dates-helper(start-date: "Jan 2023", end-date: "Present"),
  url: "github.com/kubernetes/kubernetes",
)

- Contributed 12 PRs to the scheduler component improving pod scheduling efficiency
- Fixed critical race condition in the controller manager affecting multi-cluster deployments

== Skills

- *Languages*: Python, Go, TypeScript, Java, SQL
- *Frameworks*: React, Next.js, FastAPI, Spring Boot
- *Infrastructure*: Kubernetes, Docker, Terraform, AWS, GCP
- *Tools*: Git, GitHub Actions, Datadog, Kafka
`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    // Check if Azure AI is configured
    const hasAzure = process.env.AZURE_RESOURCE_NAME && process.env.AZURE_API_KEY;

    if (hasAzure) {
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { generateText } = await import("ai");
          const { getModel } = await import("@/lib/ai");
          const { VISION_EXTRACTION_PROMPT, TYPST_CONVERSION_PROMPT } = await import("@/lib/prompts");

          const fileBytes = await file.arrayBuffer();
          const base64 = Buffer.from(fileBytes).toString("base64");

          const extractionResult = await generateText({
            model: getModel(),
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: VISION_EXTRACTION_PROMPT },
                  {
                    type: "file",
                    data: base64,
                    mediaType: "application/pdf",
                  },
                ],
              },
            ],
          });

          const extractedText = extractionResult.text;
          const sectionNames = extractedText
            .split("\n")
            .filter((line) => /^#+\s|^[A-Z][A-Z\s&]+$/.test(line.trim()))
            .map((line) => line.replace(/^#+\s*/, "").trim())
            .filter((s) => s.length > 0 && s.length < 40)
            .slice(0, 10);

          const conversionResult = await generateText({
            model: getModel(),
            messages: [
              {
                role: "user",
                content: TYPST_CONVERSION_PROMPT + "\n\n" + extractedText,
              },
            ],
          });

          let typstSource = conversionResult.text;
          typstSource = typstSource
            .replace(/^```typst\n?/, "")
            .replace(/^```\n?/, "")
            .replace(/\n?```$/, "");

          return NextResponse.json({
            typstSource,
            summary: {
              sections: sectionNames.length > 0
                ? sectionNames
                : ["Education", "Work Experience", "Projects", "Skills"],
            },
          });
        } catch (err) {
          lastError = err;
          console.error(`Azure AI parsing attempt ${attempt + 1} failed:`, err);
          if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
        }
      }
      console.error("Azure AI parsing exhausted retries:", lastError);
    }

    // Fallback: return sample Typst (demo mode)
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({
      typstSource: SAMPLE_TYPST,
      summary: {
        sections: ["Education", "Work Experience", "Projects", "Skills"],
      },
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
