import { NextRequest, NextResponse } from "next/server";

async function callAzureChat(
  typstSource: string,
  chatHistory: { role: string; content: string }[],
  userMessage: string,
) {
  const { generateText, tool } = await import("ai");
  const { z } = await import("zod");
  const { getModel } = await import("@/lib/ai");
  const { CHAT_SYSTEM_PROMPT } = await import("@/lib/prompts");

  const messages = [
    ...chatHistory.map((msg) => ({
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
      update_resume: tool({
        description: "Update the resume with edited Typst source code. Use when you have enough information to make the requested change confidently.",
        inputSchema: z.object({
          typst_code: z.string(),
          summary: z.string(),
        }),
      }),
      ask_clarification: tool({
        description: "Ask a clarifying question before making changes. Use when the request is ambiguous or requires info you don't have.",
        inputSchema: z.object({
          question: z.string(),
        }),
      }),
    },
    toolChoice: "required",
  });

  if (!result.toolCalls || result.toolCalls.length === 0) {
    return {
      action: "clarify" as const,
      question: "I'm not sure how to help with that. Could you rephrase your request?",
    };
  }

  const toolCall = result.toolCalls[0];
  const toolArgs = (toolCall as Record<string, unknown>).args ?? (toolCall as Record<string, unknown>).input;
  const args = toolArgs as Record<string, string>;
  if (toolCall.toolName === "update_resume") {
    let code = args.typst_code;
    code = code.replace(/^```typst\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");
    return { action: "edit" as const, typstSource: code, summary: args.summary };
  } else {
    return { action: "clarify" as const, question: args.question };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { typstSource, chatHistory, userMessage } = await request.json();

    if (!typstSource || !userMessage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hasAzure = process.env.AZURE_RESOURCE_NAME && process.env.AZURE_API_KEY;

    if (hasAzure) {
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await callAzureChat(typstSource, chatHistory, userMessage);
          return NextResponse.json(result);
        } catch (err) {
          lastError = err;
          console.error(`Azure AI chat attempt ${attempt + 1} failed:`, err);
          if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
        }
      }
      console.error("Azure AI chat exhausted retries:", lastError);
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
