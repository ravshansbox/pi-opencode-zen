import {
	type Api,
	type AssistantMessageEventStream,
	type Context,
	streamSimpleAnthropic,
	streamSimpleGoogle,
	streamSimpleOpenAICompletions,
	streamSimpleOpenAIResponses,
	type Model,
	type SimpleStreamOptions,
} from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type Backend = "anthropic-messages" | "google-generative-ai" | "openai-completions" | "openai-responses";

interface EndpointConfig {
	api: Backend;
	baseUrl: string;
}

const API_KEY = "OPENCODE_API_KEY";
const BASE_URL = "https://opencode.ai/zen/v1";

function opencodeHeaders(): Record<string, string> {
	const id = () => crypto.randomUUID().replace(/-/g, "").slice(0, 26);
	return {
		"User-Agent": "opencode/latest/1.3.15/cli",
		"x-opencode-client": "cli",
		"x-opencode-session": id(),
		"x-opencode-project": id(),
		"x-opencode-request": id(),
	};
}

const endpoints: Record<string, EndpointConfig> = {
	"gpt-5.4": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.4-pro": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.4-mini": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.4-nano": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.3-codex": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.2": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.2-codex": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.1": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.1-codex": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.1-codex-max": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5.1-codex-mini": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5-codex": { api: "openai-responses", baseUrl: BASE_URL },
	"gpt-5-nano": { api: "openai-responses", baseUrl: BASE_URL },
	"claude-opus-4-6": { api: "anthropic-messages", baseUrl: BASE_URL },
	"claude-opus-4-5": { api: "anthropic-messages", baseUrl: BASE_URL },
	"claude-opus-4-1": { api: "anthropic-messages", baseUrl: BASE_URL },
	"claude-sonnet-4-6": { api: "anthropic-messages", baseUrl: BASE_URL },
	"claude-sonnet-4-5": { api: "anthropic-messages", baseUrl: BASE_URL },
	"claude-sonnet-4": { api: "anthropic-messages", baseUrl: BASE_URL },
	"claude-haiku-4-5": { api: "anthropic-messages", baseUrl: BASE_URL },
	"claude-3-5-haiku": { api: "anthropic-messages", baseUrl: BASE_URL },
	"gemini-3.1-pro": { api: "google-generative-ai", baseUrl: BASE_URL },
	"gemini-3-flash": { api: "google-generative-ai", baseUrl: BASE_URL },
	"minimax-m2.5": { api: "openai-completions", baseUrl: BASE_URL },
	"minimax-m2.5-free": { api: "openai-completions", baseUrl: BASE_URL },
	"glm-5": { api: "openai-completions", baseUrl: BASE_URL },
	"kimi-k2.5": { api: "openai-completions", baseUrl: BASE_URL },
	"big-pickle": { api: "openai-completions", baseUrl: BASE_URL },
	"mimo-v2-pro-free": { api: "openai-completions", baseUrl: BASE_URL },
	"mimo-v2-omni-free": { api: "openai-completions", baseUrl: BASE_URL },
	"qwen3.6-plus-free": { api: "openai-completions", baseUrl: BASE_URL },
	"nemotron-3-super-free": { api: "openai-completions", baseUrl: BASE_URL },
};

function streamOpencodeZen(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const endpoint = endpoints[model.id];
	if (!endpoint) {
		throw new Error(`Unsupported OpenCode Zen model: ${model.id}`);
	}

	const wrappedModel = {
		...model,
		api: endpoint.api,
		baseUrl: endpoint.baseUrl,
	} as Model<Api>;

	const wrappedOptions: SimpleStreamOptions = {
		...options,
		headers: { ...opencodeHeaders(), ...options?.headers },
	};

	switch (endpoint.api) {
		case "anthropic-messages":
			return streamSimpleAnthropic(wrappedModel as Model<"anthropic-messages">, context, wrappedOptions);
		case "google-generative-ai":
			return streamSimpleGoogle(wrappedModel as Model<"google-generative-ai">, context, wrappedOptions);
		case "openai-responses":
			return streamSimpleOpenAIResponses(wrappedModel as Model<"openai-responses">, context, wrappedOptions);
		case "openai-completions":
			return streamSimpleOpenAICompletions(
				wrappedModel as Model<"openai-completions">,
				context,
				wrappedOptions,
			);
	}
}

export default function (pi: ExtensionAPI): void {
	pi.registerProvider("opencode-zen", {
		baseUrl: BASE_URL,
		apiKey: API_KEY,
		api: "openai-completions",
		streamSimple: streamOpencodeZen,
		models: [
			{ id: "big-pickle", name: "Big Pickle", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 200000, maxTokens: 128000 },
			{ id: "gpt-5-nano", name: "GPT-5 Nano", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "minimax-m2.5-free", name: "MiniMax M2.5 Free", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 204800, maxTokens: 131072 },
			{ id: "nemotron-3-super-free", name: "Nemotron 3 Super Free", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 4096 },
			{ id: "qwen3.6-plus-free", name: "Qwen3.6 Plus Free", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 64000 },
			{ id: "mimo-v2-pro-free", name: "MiMo V2 Pro Free", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 64000 },
			{ id: "mimo-v2-omni-free", name: "MiMo V2 Omni Free", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 64000 },
			{ id: "claude-3-5-haiku", name: "Claude Haiku 3.5", reasoning: false, input: ["text", "image"], cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 }, contextWindow: 200000, maxTokens: 8192 },
			{ id: "claude-haiku-4-5", name: "Claude Haiku 4.5", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 200000, maxTokens: 64000 },
			{ id: "claude-opus-4-1", name: "Claude Opus 4.1", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 200000, maxTokens: 32000 },
			{ id: "claude-opus-4-5", name: "Claude Opus 4.5", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 200000, maxTokens: 64000 },
			{ id: "claude-opus-4-6", name: "Claude Opus 4.6", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1000000, maxTokens: 128000 },
			{ id: "claude-sonnet-4", name: "Claude Sonnet 4", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 200000, maxTokens: 64000 },
			{ id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 200000, maxTokens: 64000 },
			{ id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1000000, maxTokens: 64000 },
			{ id: "gemini-3-flash", name: "Gemini 3 Flash", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 },
			{ id: "gemini-3.1-pro", name: "Gemini 3.1 Pro Preview", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 },
			{ id: "glm-5", name: "GLM-5", reasoning: true, input: ["text"], cost: { input: 1, output: 3.2, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 204800, maxTokens: 131072 },
			{ id: "kimi-k2.5", name: "Kimi K2.5", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3, cacheRead: 0.08, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536 },
			{ id: "minimax-m2.5", name: "MiniMax M2.5", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 204800, maxTokens: 131072 },
			{ id: "gpt-5", name: "GPT-5", reasoning: true, input: ["text", "image"], cost: { input: 1.07, output: 8.5, cacheRead: 0.107, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5-codex", name: "GPT-5 Codex", reasoning: true, input: ["text", "image"], cost: { input: 1.07, output: 8.5, cacheRead: 0.107, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.1", name: "GPT-5.1", reasoning: true, input: ["text", "image"], cost: { input: 1.07, output: 8.5, cacheRead: 0.107, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.1-codex", name: "GPT-5.1 Codex", reasoning: true, input: ["text", "image"], cost: { input: 1.07, output: 8.5, cacheRead: 0.107, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.1-codex-max", name: "GPT-5.1 Codex Max", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.1-codex-mini", name: "GPT-5.1 Codex Mini", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.2", name: "GPT-5.2", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.2-codex", name: "GPT-5.2 Codex", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.4", name: "GPT-5.4", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 }, contextWindow: 272000, maxTokens: 128000 },
			{ id: "gpt-5.4-mini", name: "GPT-5.4 Mini", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.4-nano", name: "GPT-5.4 Nano", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 400000, maxTokens: 128000 },
			{ id: "gpt-5.4-pro", name: "GPT-5.4 Pro", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 30, cacheWrite: 0 }, contextWindow: 1050000, maxTokens: 128000 },
		],
	});
}
