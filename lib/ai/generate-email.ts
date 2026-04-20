import "server-only"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const emailTool: Anthropic.Tool = {
  name: "generate_outreach_email",
  description: "Generate a personalized cold outreach email",
  input_schema: {
    type: "object" as const,
    properties: {
      subject: {
        type: "string",
        description: "Compelling email subject line, max 80 characters, specific and personal",
      },
      body: {
        type: "string",
        description:
          "Email body in plain text, 150-250 words. Professional, warm tone. End with a single low-friction CTA like 'Would you be open to a 15-minute call?'",
      },
      previewText: {
        type: "string",
        description: "50-character preview snippet shown in email clients before opening",
      },
    },
    required: ["subject", "body", "previewText"],
  },
}

export async function generateOutreachEmail(
  niche: string,
  targetAudience: string
): Promise<{ subject: string; body: string; previewText: string }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [emailTool],
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: `Generate a cold outreach email for a service in the "${niche}" niche, targeting "${targetAudience}".

The email should:
- Feel personal and researched, not generic
- Lead with a specific insight or observation relevant to the target audience
- Briefly explain the value proposition (2-3 sentences max)
- End with one clear, low-friction CTA
- Sound human, not like a template

Generate the email now.`,
      },
    ],
  })

  const toolUse = response.content.find((b) => b.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return structured output")
  }

  return toolUse.input as { subject: string; body: string; previewText: string }
}
