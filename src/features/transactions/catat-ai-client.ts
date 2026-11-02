type CatatAiProvider = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const detectedModels = new Map<string, string>();

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function rootUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
}

function completionsUrl(baseUrl: string) {
  const trimmed = rootUrl(baseUrl);

  if (trimmed.endsWith("/chat/completions")) {
    return trimmed;
  }

  return `${trimmed}/chat/completions`;
}

function defaultModel(baseUrl: string) {
  if (baseUrl.includes("deepseek.com")) {
    return "deepseek-chat";
  }

  if (baseUrl.includes("fortytwo.network")) {
    return "qwen/qwen3.8-27b";
  }

  return "";
}

function scoreModelId(id: string) {
  const value = id.toLowerCase();

  if (/(embed|whisper|tts|dall-e|dalle|moderation|image|audio|rerank|vision-preview)/.test(value)) {
    return -1;
  }

  if (/(deepseek-chat|gpt-4o-mini|gpt-4.1-mini|llama-3.1-8b-instant|grok-)/.test(value)) {
    return 40;
  }

  if (/(chat|instruct|grok|llama|qwen|gemini|mistral|kimi|gpt|claude|deepseek)/.test(value)) {
    return 20;
  }

  return 5;
}

async function detectModel(provider: CatatAiProvider) {
  const cacheKey = `${provider.baseUrl}::${provider.apiKey}`;
  const cached = detectedModels.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(`${rootUrl(provider.baseUrl)}/models`, {
    headers: {
      Authorization: `Bearer ${provider.apiKey}`
    },
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    return "";
  }

  const payload = (await response.json()) as { data?: Array<{ id?: string }> };
  const ids = (payload.data ?? []).map((item) => item.id?.trim() || "").filter(Boolean);
  const ranked = ids
    .map((id) => ({ id, score: scoreModelId(id) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const picked = ranked[0]?.id || "";

  if (picked) {
    detectedModels.set(cacheKey, picked);
  }

  return picked;
}

async function resolveModel(provider: CatatAiProvider) {
  if (provider.model) {
    return provider.model;
  }

  return detectModel(provider);
}

export function listCatatAiProviders(): CatatAiProvider[] {
  const suffixes = ["", "_2", "_3", "_4", "_5"];
  const providers: CatatAiProvider[] = [];
  const seen = new Set<string>();

  for (const suffix of suffixes) {
    const apiKey = env(`CATAT_AI_API_KEY${suffix}`);

    if (!apiKey) {
      continue;
    }

    const baseUrl = env(`CATAT_AI_BASE_URL${suffix}`) || "https://api.deepseek.com";
    const model = env(`CATAT_AI_MODEL${suffix}`) || defaultModel(baseUrl);

    if (seen.has(`${baseUrl}::${apiKey}`)) {
      continue;
    }

    seen.add(`${baseUrl}::${apiKey}`);
    providers.push({ baseUrl, apiKey, model });
  }

  const deepseekKey = env("DEEPSEEK_API_KEY");

  if (deepseekKey && !seen.has(`https://api.deepseek.com::${deepseekKey}`)) {
    providers.push({
      baseUrl: "https://api.deepseek.com",
      apiKey: deepseekKey,
      model: "deepseek-chat"
    });
  }

  return providers;
}

async function completeOnce(
  provider: CatatAiProvider,
  messages: Array<{ role: string; content: string }>,
  jsonMode: boolean
) {
  const model = await resolveModel(provider);

  if (!model) {
    return null;
  }

  const response = await fetch(completionsUrl(provider.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages
    }),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content ?? null;
}

export async function completeCatatJson(messages: Array<{ role: string; content: string }>) {
  for (const provider of listCatatAiProviders()) {
    try {
      const withJson = await completeOnce(provider, messages, true);

      if (withJson) {
        return withJson;
      }

      const withoutJson = await completeOnce(provider, messages, false);

      if (withoutJson) {
        return withoutJson;
      }
    } catch {
      // try the next key
    }
  }

  return null;
}
