import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AiError, aiConfigured, aiModel, researchModel, type AiUsage } from "./provider";

export type WebSource = { title: string; url: string; age: string | null };
export type WebResearch = {
  notes: string;
  sources: WebSource[];
  searches: number;
  detail: string;
  usage: AiUsage;
};

/** Older and smaller models use the basic search tool; current ones use the newer one. */
function searchToolType(model: string): "web_search_20260209" | "web_search_20250305" {
  return /haiku/.test(model) ? "web_search_20250305" : "web_search_20260209";
}

/**
 * Search adapter: asks the model to search the live web and report back.
 * Sources are read from the search results themselves, never from the model's prose,
 * so a link shown to the author is always one that was really returned.
 */
export async function searchWeb(input: {
  question: string;
  maxSearches: number;
}): Promise<WebResearch> {
  if (!aiConfigured()) throw new AiError("not-configured");
  const cheap = researchModel();
  try {
    return await searchWith(cheap, input);
  } catch (error) {
    // If the cheaper model cannot do the search, fall back to the main model once.
    const main = aiModel();
    if (main === cheap || !(error instanceof AiError) || error.code !== "failed") throw error;
    return searchWith(main, input);
  }
}

async function searchWith(
  model: string,
  input: { question: string; maxSearches: number },
): Promise<WebResearch> {
  const client = new Anthropic({ timeout: 90_000, maxRetries: 1 });
  const started = Date.now();
  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: searchToolType(model), name: "web_search", max_uses: input.maxSearches },
  ];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: input.question }];

  let inputTokens = 0;
  let outputTokens = 0;
  let searches = 0;
  const sources = new Map<string, WebSource>();
  const notes: string[] = [];
  let lastStop = "";
  let turns = 0;

  for (let turn = 0; turn < 3; turn++) {
    let response: Anthropic.Message;
    try {
      // Low effort keeps the model's private reasoning short, so the token allowance
      // goes to reading results and writing the notes.
      response = await client.messages.create({
        model,
        max_tokens: 12000,
        output_config: { effort: "low" },
        tools,
        messages,
      });
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) throw new AiError("not-configured");
      if (error instanceof Anthropic.RateLimitError) throw new AiError("busy");
      throw new AiError("failed");
    }
    inputTokens +=
      response.usage.input_tokens +
      (response.usage.cache_creation_input_tokens ?? 0) +
      (response.usage.cache_read_input_tokens ?? 0);
    outputTokens += response.usage.output_tokens;
    searches += response.usage.server_tool_use?.web_search_requests ?? 0;

    if (response.stop_reason === "refusal") throw new AiError("refused");

    for (const block of response.content) {
      if (block.type === "text") {
        notes.push(block.text);
        // Links the model cited in its notes also count as real search results.
        for (const citation of block.citations ?? []) {
          if (citation.type === "web_search_result_location" && /^https?:\/\//.test(citation.url)) {
            if (!sources.has(citation.url)) {
              sources.set(citation.url, { title: citation.title ?? "", url: citation.url, age: null });
            }
          }
        }
      }
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const result of block.content) {
          if (result.type === "web_search_result" && /^https?:\/\//.test(result.url)) {
            sources.set(result.url, {
              title: result.title,
              url: result.url,
              age: result.page_age ?? null,
            });
          }
        }
      }
    }

    lastStop = response.stop_reason ?? "";
    turns = turn + 1;
    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content });
  }

  const text = notes.join("").trim();
  // A search that ran out of room before writing anything is a failure, not an empty result.
  if (!text) throw new AiError("failed");

  return {
    notes: text,
    sources: [...sources.values()],
    searches,
    // Counts only, never content: helps explain a run that found nothing.
    detail: `notes ${text.length} chars, ${sources.size} sources, ${searches} searches, ${turns} turns, ${lastStop}`,
    usage: { provider: "anthropic", model, inputTokens, outputTokens, latencyMs: Date.now() - started },
  };
}
