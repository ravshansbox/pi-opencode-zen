import {
  type Api,
  type AssistantMessageEventStream,
  type Model,
  type SimpleStreamOptions,
  type SystemMessage,
  type Tool,
  type TranscriptContext,
  Type,
  anthropicMessagesApi,
  googleGenerativeAIApi,
  openAICompletionsApi,
  openAIResponsesApi,
} from '@earendil-works/pi-ai/compat';
import type { ExtensionAPI, ProviderModelConfig } from '@earendil-works/pi-coding-agent';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Backend =
  'anthropic-messages' | 'google-generative-ai' | 'openai-completions' | 'openai-responses';

interface EndpointConfig {
  api: Backend;
  baseUrl: string;
}

interface ModelsDevModelInfo {
  name?: string;
  status?: string | null;
  reasoning?: boolean;
  modalities?: {
    input?: string[];
  };
  limit?: {
    context?: number;
    output?: number;
  };
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
    const authPath = join(process.env['HOME'] ?? '', '.pi', 'agent', 'auth.json');
    const auth = JSON.parse(readFileSync(authPath, 'utf8')) as Record<string, { key?: string }>;
    const key = auth?.['opencode-zen']?.key?.trim();
    return key || undefined;
  } catch {
    return undefined;
  }
}

async function fetchVisibleModelIds(apiKey: string): Promise<Set<string> | undefined> {
  try {
    const response = await fetch(`${BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, ...opencodeHeaders() },
    });
    if (!response.ok) return undefined;
    const json = (await response.json()) as { data?: Array<{ id?: string }> };
    return new Set((json.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id)));
  } catch {
    return undefined;
  }
}

async function fetchModelsDevInfo(): Promise<Record<string, ModelsDevModelInfo> | undefined> {
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

function isFreeModel(id: string, model: ModelsDevModelInfo | undefined): boolean {
  if (id.endsWith('-free') || id === 'big-pickle') return true;
  const cost = model?.cost;
  if (!cost) return false;
  return (cost.input ?? 0) === 0;
}

function getVisibleModels(
  visibleIds?: Set<string>,
  modelsDevInfo?: Record<string, ModelsDevModelInfo>,
  publicMode = false,
): ProviderModelConfig[] {
  const modelMap = new Map<string, ProviderModelConfig>();

  for (const model of allModels) {
    const input = model.input.filter(
      (value): value is 'text' | 'image' => value === 'text' || value === 'image',
    ) as ('text' | 'image')[];
    modelMap.set(model.id, {
      id: model.id,
      name: model.name,
      reasoning: model.reasoning,
      input,
      cost: { ...model.cost },
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
    });
  }

  if (visibleIds) {
    for (const id of visibleIds) {
      const dev = modelsDevInfo?.[id];
      if (dev && dev.status !== 'deprecated') {
        const input = (dev.modalities?.input ?? ['text']).filter(
          (value): value is 'text' | 'image' => value === 'text' || value === 'image',
        );
        modelMap.set(id, {
          id,
          name: dev.name || id,
          reasoning: Boolean(dev.reasoning),
          input: input.length > 0 ? input : ['text'],
          cost: {
            input: dev.cost?.input ?? 0,
            output: dev.cost?.output ?? 0,
            cacheRead: dev.cost?.cache_read ?? 0,
            cacheWrite: dev.cost?.cache_write ?? 0,
          },
          contextWindow: dev.limit?.context ?? 200000,
          maxTokens: dev.limit?.output ?? 64000,
        });
      } else if (!modelMap.has(id) && (id.endsWith('-free') || id === 'big-pickle')) {
        modelMap.set(id, {
          id,
          name: id,
          reasoning: true,
          input: ['text'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 200000,
          maxTokens: 64000,
        });
      }
    }
  }

  let models = Array.from(modelMap.values());

  if (visibleIds) {
    models = models.filter((m) => visibleIds.has(m.id));
  }

  if (modelsDevInfo) {
    models = models.filter((m) => modelsDevInfo[m.id]?.status !== 'deprecated');
  }

  if (publicMode) {
    models = models.filter((m) => isFreeModel(m.id, modelsDevInfo?.[m.id]));
  }

  return models;
}

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function canonicalId(prefix: 'ses_' | 'msg_'): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hexPart = Array.from(bytes.subarray(0, 6), (b) => b.toString(16).padStart(2, '0')).join('');
  const b62Part = Array.from(bytes.subarray(6, 20), (b) => BASE62[b % 62]).join('');
  return `${prefix}${hexPart}${b62Part}`;
}

function opencodeHeaders(): Record<string, string> {
  return {
    'User-Agent': 'opencode/1.18.31',
    'x-opencode-client': 'cli',
    'x-opencode-session': canonicalId('ses_'),
    'x-opencode-request': canonicalId('msg_'),
    'x-opencode-project': 'global',
    Accept: 'text/event-stream',
  };
}

function ensureOpencodeGateTools(context: TranscriptContext): TranscriptContext {
  const messages = [...context.messages];
  const first = messages[0];
  const gateTools: Tool[] = [
    {
      name: 'bash',
      description: 'Execute bash command',
      parameters: Type.Object({ command: Type.String() }),
    },
    {
      name: 'read',
      description: 'Read file',
      parameters: Type.Object({ path: Type.String() }),
    },
  ];

  if (first && first.role === 'system') {
    const existing = first.toolsAdded ?? [];
    const existingNames = new Set(existing.map((t) => t.name));
    const missing = gateTools.filter((t) => !existingNames.has(t.name));
    if (missing.length > 0) {
      const updatedFirst: SystemMessage = {
        ...first,
        toolsAdded: [...existing, ...missing],
      };
      messages[0] = updatedFirst;
    }
  } else {
    const initialMessage: SystemMessage = {
      role: 'system',
      content: '',
      toolsAdded: gateTools,
      timestamp: 0,
    };
    messages.unshift(initialMessage);
  }

  return { ...context, messages };
}

function getEndpointConfig(modelId: string): EndpointConfig {
  if (endpoints[modelId]) return endpoints[modelId];
  if (modelId.startsWith('claude-')) return { api: 'anthropic-messages', baseUrl: BASE_URL };
  if (modelId.startsWith('gemini-')) return { api: 'google-generative-ai', baseUrl: BASE_URL };
  if (modelId.startsWith('gpt-')) return { api: 'openai-responses', baseUrl: BASE_URL };
  return { api: 'openai-completions', baseUrl: BASE_URL };
}

function streamOpencodeZen(
  model: Model<Api>,
  context: TranscriptContext,
  options?: SimpleStreamOptions,
): AssistantMessageEventStream {
  if (model.provider !== 'opencode-zen') {
    return openAICompletionsApi().streamSimple(model, context, options);
  }

  const endpoint = getEndpointConfig(model.id);

  const wrappedModel = {
    ...model,
    api: endpoint.api,
    baseUrl: endpoint.baseUrl,
  } as Model<Api>;

  const wrappedOptions: SimpleStreamOptions = {
    ...options,
    headers: { ...options?.headers, ...opencodeHeaders() },
  };

  const gateContext = ensureOpencodeGateTools(context);

  switch (endpoint.api) {
    case 'anthropic-messages':
      return anthropicMessagesApi().streamSimple(wrappedModel, gateContext, wrappedOptions);
    case 'google-generative-ai':
      return googleGenerativeAIApi().streamSimple(wrappedModel, gateContext, wrappedOptions);
    case 'openai-responses':
      return openAIResponsesApi().streamSimple(wrappedModel, gateContext, wrappedOptions);
    case 'openai-completions':
      return openAICompletionsApi().streamSimple(wrappedModel, gateContext, wrappedOptions);
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
