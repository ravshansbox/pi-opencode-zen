import {
  type Api,
  type AssistantMessageEventStream,
  type Context,
  type Model,
  type SimpleStreamOptions,
} from '@earendil-works/pi-ai';
import { anthropicMessagesApi } from '@earendil-works/pi-ai/api/anthropic-messages.lazy';
import { googleGenerativeAIApi } from '@earendil-works/pi-ai/api/google-generative-ai.lazy';
import { openAICompletionsApi } from '@earendil-works/pi-ai/api/openai-completions.lazy';
import { openAIResponsesApi } from '@earendil-works/pi-ai/api/openai-responses.lazy';
import type {
  ExtensionAPI,
  ProviderModelConfig,
} from '@earendil-works/pi-coding-agent';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Backend =
  | 'anthropic-messages'
  | 'google-generative-ai'
  | 'openai-completions'
  | 'openai-responses';

interface EndpointConfig {
  api: Backend;
  baseUrl: string;
}

interface ModelsDevModelInfo {
  status?: string | null;
  cost?: {
    input?: number | null;
    output?: number | null;
    cache_read?: number | null;
    cache_write?: number | null;
  } | null;
}

const API_KEY = 'OPENCODE_API_KEY';
const BASE_URL = 'https://opencode.ai/zen/v1';
const MODELS_DEV_URL = 'https://models.dev/api.json';

// Full model list - updated from models.dev
const allModels = [
  {
    id: 'big-pickle',
    name: 'Big Pickle',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 200000,
    maxTokens: 128000,
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    reasoning: false,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 200000,
    maxTokens: 8192,
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5 (latest)',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
    contextWindow: 200000,
    maxTokens: 64000,
  },
  {
    id: 'claude-opus-4-1',
    name: 'Claude Opus 4.1 (latest)',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
    contextWindow: 200000,
    maxTokens: 32000,
  },
  {
    id: 'claude-opus-4-5',
    name: 'Claude Opus 4.5 (latest)',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
    contextWindow: 200000,
    maxTokens: 64000,
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
    contextWindow: 1000000,
    maxTokens: 128000,
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
    contextWindow: 1000000,
    maxTokens: 64000,
  },
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5 (latest)',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
    contextWindow: 200000,
    maxTokens: 64000,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
    contextWindow: 1000000,
    maxTokens: 64000,
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    reasoning: true,
    input: ['text', 'image', 'video', 'audio', 'pdf'],
    cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0 },
    contextWindow: 1048576,
    maxTokens: 65536,
  },
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    reasoning: true,
    input: ['text', 'image', 'video', 'audio', 'pdf'],
    cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 },
    contextWindow: 1048576,
    maxTokens: 65536,
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro Preview',
    reasoning: true,
    input: ['text', 'image', 'video', 'audio', 'pdf'],
    cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 },
    contextWindow: 1048576,
    maxTokens: 65536,
  },
  {
    id: 'glm-4.6',
    name: 'glm-4.6',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 202752,
    maxTokens: 131072,
  },
  {
    id: 'glm-4.7',
    name: 'glm-4.7',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 202752,
    maxTokens: 131072,
  },
  {
    id: 'glm-5',
    name: 'glm-5',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 202752,
    maxTokens: 131072,
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5-codex',
    name: 'GPT-5-Codex',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0.05, output: 0.4, cacheRead: 0.005, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 1.25, output: 10, cacheRead: 0.13, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.1-codex',
    name: 'GPT-5.1 Codex',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.1-codex-max',
    name: 'GPT-5.1 Codex Max',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.1-codex-mini',
    name: 'GPT-5.1 Codex mini',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.3-codex',
    name: 'GPT-5.3 Codex',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.3-codex-spark',
    name: 'GPT-5.3 Codex Spark',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 32000,
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    reasoning: true,
    input: ['text', 'image', 'pdf'],
    cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 },
    contextWindow: 1050000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 mini',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.4-nano',
    name: 'GPT-5.4 nano',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 },
    contextWindow: 400000,
    maxTokens: 128000,
  },
  {
    id: 'gpt-5.4-pro',
    name: 'GPT-5.4 Pro',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1050000,
    maxTokens: 128000,
  },
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 128000,
  },
  {
    id: 'kimi-k2-thinking',
    name: 'kimi-k2-thinking',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 262144,
    maxTokens: 262144,
  },
  {
    id: 'kimi-k2.5',
    name: 'kimi-k2.5',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 262144,
    maxTokens: 262144,
  },
  {
    id: 'minimax-m2.1',
    name: 'minimax-m2.1',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 204800,
    maxTokens: 131072,
  },
  {
    id: 'minimax-m2.5',
    name: 'minimax-m2.5',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 204800,
    maxTokens: 131072,
  },
  {
    id: 'minimax-m2.5-free',
    name: 'MiniMax M2.5 Free',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 204800,
    maxTokens: 131072,
  },
  {
    id: 'nemotron-3-super-free',
    name: 'Nemotron 3 Super Free',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 204800,
    maxTokens: 128000,
  },
  {
    id: 'qwen3.6-plus-free',
    name: 'Qwen3.6 Plus Free',
    reasoning: true,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1048576,
    maxTokens: 64000,
  },
  {
    id: 'trinity-large-preview-free',
    name: 'Trinity Large Preview',
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 131072,
    maxTokens: 131072,
  },
] as const;

const endpoints: Record<string, EndpointConfig> = {
  // GPT models - openai-responses
  'gpt-5.4': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.4-pro': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.4-mini': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.4-nano': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.3-codex-spark': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.3-codex': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.2': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.2-codex': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.1': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.1-codex-max': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.1-codex': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5.1-codex-mini': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5-codex': { api: 'openai-responses', baseUrl: BASE_URL },
  'gpt-5-nano': { api: 'openai-responses', baseUrl: BASE_URL },
  // Claude models - anthropic-messages
  'claude-opus-4-6': { api: 'anthropic-messages', baseUrl: BASE_URL },
  'claude-opus-4-5': { api: 'anthropic-messages', baseUrl: BASE_URL },
  'claude-opus-4-1': { api: 'anthropic-messages', baseUrl: BASE_URL },
  'claude-sonnet-4-6': { api: 'anthropic-messages', baseUrl: BASE_URL },
  'claude-sonnet-4-5': { api: 'anthropic-messages', baseUrl: BASE_URL },
  'claude-sonnet-4': { api: 'anthropic-messages', baseUrl: BASE_URL },
  'claude-haiku-4-5': { api: 'anthropic-messages', baseUrl: BASE_URL },
  'claude-3-5-haiku': { api: 'anthropic-messages', baseUrl: BASE_URL },
  // Gemini models - google-generative-ai
  'gemini-3.1-pro': { api: 'google-generative-ai', baseUrl: BASE_URL },
  'gemini-3-pro': { api: 'google-generative-ai', baseUrl: BASE_URL },
  'gemini-3-flash': { api: 'google-generative-ai', baseUrl: BASE_URL },
  // GLM models - openai-completions
  'glm-5': { api: 'openai-completions', baseUrl: BASE_URL },
  'glm-4.7': { api: 'openai-completions', baseUrl: BASE_URL },
  'glm-4.6': { api: 'openai-completions', baseUrl: BASE_URL },
  // MiniMax models - openai-completions
  'minimax-m2.5': { api: 'openai-completions', baseUrl: BASE_URL },
  'minimax-m2.5-free': { api: 'openai-completions', baseUrl: BASE_URL },
  'minimax-m2.1': { api: 'openai-completions', baseUrl: BASE_URL },
  // Kimi models - openai-completions
  'kimi-k2.5': { api: 'openai-completions', baseUrl: BASE_URL },
  'kimi-k2': { api: 'openai-completions', baseUrl: BASE_URL },
  'kimi-k2-thinking': { api: 'openai-completions', baseUrl: BASE_URL },
  // Other models - openai-completions
  'big-pickle': { api: 'openai-completions', baseUrl: BASE_URL },
  'trinity-large-preview-free': {
    api: 'openai-completions',
    baseUrl: BASE_URL,
  },
  'qwen3.6-plus-free': { api: 'openai-completions', baseUrl: BASE_URL },
  'nemotron-3-super-free': { api: 'openai-completions', baseUrl: BASE_URL },
};

function getConfiguredApiKey(): string | undefined {
  const env = process.env[API_KEY]?.trim();
  if (env) return env;

  try {
    const authPath = join(
      process.env['HOME'] ?? '',
      '.pi',
      'agent',
      'auth.json',
    );
    const auth = JSON.parse(readFileSync(authPath, 'utf8')) as Record<
      string,
      { key?: string }
    >;
    const key = auth?.['opencode-zen']?.key?.trim();
    return key || undefined;
  } catch {
    return undefined;
  }
}

async function fetchVisibleModelIds(
  apiKey: string,
): Promise<Set<string> | undefined> {
  try {
    const response = await fetch(`${BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, ...opencodeHeaders() },
    });
    if (!response.ok) return undefined;
    const json = (await response.json()) as { data?: Array<{ id?: string }> };
    return new Set(
      (json.data ?? [])
        .map((m) => m.id)
        .filter((id): id is string => Boolean(id)),
    );
  } catch {
    return undefined;
  }
}

async function fetchModelsDevInfo(): Promise<
  Record<string, ModelsDevModelInfo> | undefined
> {
  try {
    const response = await fetch(MODELS_DEV_URL);
    if (!response.ok) return undefined;
    const json = (await response.json()) as {
      opencode?: { models?: Record<string, ModelsDevModelInfo> };
    };
    return json.opencode?.models;
  } catch {
    return undefined;
  }
}

function isPublicMode(apiKey?: string): boolean {
  return !apiKey || apiKey === 'public';
}

function isFreeModel(model: ModelsDevModelInfo | undefined): boolean {
  const cost = model?.cost;
  if (!cost) return false;
  return (cost.input ?? 0) === 0;
}

function getVisibleModels(
  visibleIds?: Set<string>,
  modelsDevInfo?: Record<string, ModelsDevModelInfo>,
  publicMode = false,
): ProviderModelConfig[] {
  let models = visibleIds
    ? allModels.filter((m) => visibleIds.has(m.id))
    : [...allModels];
  if (modelsDevInfo) {
    models = models.filter((m) => modelsDevInfo[m.id]?.status !== 'deprecated');
    if (publicMode) {
      models = models.filter((m) => isFreeModel(modelsDevInfo[m.id]));
    }
  }
  return models.map((model) => {
    const input = model.input.filter(
      (value): value is 'text' | 'image' =>
        value === 'text' || value === 'image',
    ) as ('text' | 'image')[];
    return {
      id: model.id,
      name: model.name,
      reasoning: model.reasoning,
      input,
      cost: { ...model.cost },
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
    };
  });
}

function opencodeHeaders(): Record<string, string> {
  const id = () => crypto.randomUUID().replace(/-/g, '').slice(0, 26);
  return {
    'User-Agent': 'opencode/latest/1.3.15/cli',
    'x-opencode-client': 'cli',
    'x-opencode-session': id(),
    'x-opencode-project': id(),
    'x-opencode-request': id(),
  };
}

function streamOpencodeZen(
  model: Model<Api>,
  context: Context,
  options?: SimpleStreamOptions,
): AssistantMessageEventStream {
  const endpoint = endpoints[model.id];
  if (!endpoint || model.provider !== 'opencode-zen') {
    return openAICompletionsApi().streamSimple(model, context, options);
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
    case 'anthropic-messages':
      return anthropicMessagesApi().streamSimple(
        wrappedModel,
        context,
        wrappedOptions,
      );
    case 'google-generative-ai':
      return googleGenerativeAIApi().streamSimple(
        wrappedModel,
        context,
        wrappedOptions,
      );
    case 'openai-responses':
      return openAIResponsesApi().streamSimple(
        wrappedModel,
        context,
        wrappedOptions,
      );
    case 'openai-completions':
      return openAICompletionsApi().streamSimple(
        wrappedModel,
        context,
        wrappedOptions,
      );
  }
}

export default async function (pi: ExtensionAPI): Promise<void> {
  const apiKey = getConfiguredApiKey();
  const [visibleIds, modelsDevInfo] = await Promise.all([
    apiKey ? fetchVisibleModelIds(apiKey) : Promise.resolve(undefined),
    fetchModelsDevInfo(),
  ]);

  pi.registerProvider('opencode-zen', {
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    api: 'openai-completions',
    streamSimple: streamOpencodeZen,
    models: getVisibleModels(visibleIds, modelsDevInfo, isPublicMode(apiKey)),
  });
}
