import { createAnthropic } from "@ai-sdk/anthropic";

function getBaseURL() {
  const endpoint = process.env.AZURE_RESOURCE_NAME!;
  return endpoint.replace(/\/messages\/?$/, "");
}

const anthropic = createAnthropic({
  baseURL: getBaseURL(),
  apiKey: process.env.AZURE_API_KEY!,
  headers: {
    "api-key": process.env.AZURE_API_KEY!,
  },
});

export function getModel() {
  return anthropic(process.env.AZURE_DEPLOYMENT_NAME || "claude-sonnet-4-5");
}
