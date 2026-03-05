import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { typstSource, chatHistory, userMessage } = await request.json();

    if (!typstSource || !userMessage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hasAzure = process.env.AZURE_RESOURCE_NAME && process.env.AZURE_API_KEY;

    if (hasAzure) {
      try {
        const { generateText } = await import("ai");
        const { z } = await import("zod");
        const { getModel } = await import("@/lib/ai");
        const { CHAT_SYSTEM_PROMPT } = await import("@/lib/prompts");

        const messages = [
          ...chatHistory.map((msg: { role: string; content: string }) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          { role: "user" as const, content: userMessage },
        ];

        const result = await generateText({
          model: getModel(),
          system: CHAT_SYSTEM_PROMPT + "\n\n## Current Typst Source:\n```typst\n" + typstSource + "\n```",
          messages,
          tools: {
            update_resume: {
              description: "Update the resume with edited Typst source code. Use when you have enough information to make the requested change confidently.",
              parameters: z.object({
                typst_code: z.string().describe("Complete updated Typst source"),
                summary: z.string().describe("Brief summary of changes"),
              }),
            },
            ask_clarification: {
              description: "Ask a clarifying question before making changes. Use when the request is ambiguous or requires info you don't have.",
              parameters: z.object({
                question: z.string().describe("The question to ask"),
              }),
            },
          },
          toolChoice: "required",
        });

        const toolCall = result.toolCalls[0];
        if (toolCall.toolName === "update_resume") {
          let code = toolCall.args.typst_code;
          code = code.replace(/^```typst\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");
          return NextResponse.json({
            action: "edit",
            typstSource: code,
            summary: toolCall.args.summary,
          });
        } else {
          return NextResponse.json({
            action: "clarify",
            question: toolCall.args.question,
          });
        }
      } catch (aiError) {
        console.error("Azure AI chat failed:", aiError);
      }
    }

    // Demo mode: simple mock responses
    const lower = userMessage.toLowerCase();

    if (lower.includes("concise") || lower.includes("shorter") || lower.includes("brief")) {
      return NextResponse.json({
        action: "edit",
        typstSource: typstSource,
        summary: "Summary made more concise (demo mode — connect Azure AI for real edits)",
      });
    }

    if (lower.includes("add") && (lower.includes("cert") || lower.includes("section"))) {
      return NextResponse.json({
        action: "clarify",
        question: "I'd be happy to help! Could you tell me which certification or section you'd like to add, including any relevant details like dates and issuing organization?",
      });
    }

    return NextResponse.json({
      action: "edit",
      typstSource: typstSource,
      summary: `Processed: "${userMessage}" (demo mode — connect Azure AI for real edits)`,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
