import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export type AiErrorCode = "not-configured" | "refused" | "invalid" | "busy" | "failed";

export class AiError extends Error {
  constructor(public code: AiErrorCode) {
    super(code);
  }
}

export type AiUsage = {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
};

/** The model is a setting, so it can be changed without touching code. */
export function aiModel(): string {
  return process.env.AI_MODEL?.trim() || "claude-opus-5-5";
}

/**
 * Web searches feed a lot of text to the model, so they use a cheaper model by default.
 * The writing itself still uses the main model.
 */
export function researchModel(): string {
  return process.env.AI_RESEARCH_MODEL?.trim() || "claude-haiku-5-5";
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Asks the model for an answer in a fixed shape. The answer is checked against
 * `schema`; anything that does not fit is retried once, then reported as an error.
 */
export async function generateStructured<Schema extends z.ZodType>(input: {
  system: string;
  prompt: string;
  schema: Schema;
  maxTokens?: number;
}): Promise<{ data: z.infer<Schema>; usage: AiUsage }> {
  if ((process.env.AI_PROVIDER?.trim() || "anthropic") !== "anthropic" || !aiConfigured()) {
    throw new AiError("not-configured");
  }
  const client = new Anthropic({ timeout: 110_000, maxRetries: 1 });
  const model = aiModel();
  const started = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;

  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await client.messages.parse({
        model,
        max_tokens: input.maxTokens ?? 8000,
        system: [{ type: "text", text: input.system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: input.prompt }],
        output_config: { format: zodOutputFormat(input.schema) },
      });
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) throw new AiError("not-configured");
      if (error instanceof Anthropic.PermissionDeniedError) throw new AiError("not-configured");
      if (error instanceof Anthropic.RateLimitError) throw new AiError("busy");
      if (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500) throw new AiError("busy");
      throw new AiError("failed");
    }

    const usage = response.usage;
    inputTokens +=
      usage.input_tokens +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0);
    outputTokens += usage.output_tokens;

    if (response.stop_reason === "refusal") throw new AiError("refused");

    const checked = input.schema.safeParse(response.parsed_output);
    if (response.stop_reason !== "max_tokens" && checked.success) {
      return {
        data: checked.data,
        usage: {
          provider: "anthropic",
          model,
          inputTokens,
          outputTokens,
          latencyMs: Date.now() - started,
        },
      };
    }
  }
  throw new AiError("invalid");
}

export const AI_ERROR_MESSAGES: Record<AiErrorCode, string> = {
  "not-configured":
    "The AI is not connected yet. Add ANTHROPIC_API_KEY in Vercel (Settings, Environment Variables), then redeploy.",
  refused: "The AI declined to write this one. Try rewording the idea.",
  invalid: "The AI's answer did not come back in the right shape. Nothing was saved. Please try again.",
  busy: "The AI service is busy right now. Wait a minute and try again.",
  failed: "The AI request failed. Nothing was saved. Please try again.",
};
