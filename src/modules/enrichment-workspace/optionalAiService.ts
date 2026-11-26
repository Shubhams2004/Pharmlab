import { SyllabusSubjectNode, SyllabusTopicNode } from '../study-mode/types';
import { EnrichmentSectionBlueprint } from './sectionCatalog';

export type OptionalAiProvider = 'none' | 'gemini' | 'openai_compatible';

export interface OptionalAiConfig {
  provider: OptionalAiProvider;
  apiKey: string;
  model: string;
  endpointUrl: string;
}

const AI_CONFIG_STORAGE_KEY = 'pharmlab_optional_ai_config_v1';

export const DEFAULT_OPTIONAL_AI_CONFIG: OptionalAiConfig = {
  provider: 'none',
  apiKey: '',
  model: 'gemini-2.5-flash',
  endpointUrl: 'https://api.openai.com/v1/chat/completions'
};

export function loadOptionalAiConfig(): OptionalAiConfig {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_OPTIONAL_AI_CONFIG;
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_OPTIONAL_AI_CONFIG;
    const parsed = JSON.parse(raw) as Partial<OptionalAiConfig>;
    return {
      provider:
        parsed.provider === 'gemini' || parsed.provider === 'openai_compatible'
          ? parsed.provider
          : 'none',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model:
        typeof parsed.model === 'string' && parsed.model.trim()
          ? parsed.model.trim()
          : DEFAULT_OPTIONAL_AI_CONFIG.model,
      endpointUrl:
        typeof parsed.endpointUrl === 'string' && parsed.endpointUrl.trim()
          ? parsed.endpointUrl.trim()
          : DEFAULT_OPTIONAL_AI_CONFIG.endpointUrl
    };
  } catch {
    return DEFAULT_OPTIONAL_AI_CONFIG;
  }
}

export function saveOptionalAiConfig(config: OptionalAiConfig): OptionalAiConfig {
  const sanitized: OptionalAiConfig = {
    provider: config.provider,
    apiKey: config.apiKey.trim(),
    model: config.model.trim() || DEFAULT_OPTIONAL_AI_CONFIG.model,
    endpointUrl: config.endpointUrl.trim() || DEFAULT_OPTIONAL_AI_CONFIG.endpointUrl
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
    }
  } catch {
    // ignore storage errors
  }
  return sanitized;
}

export function clearOptionalAiKey(): OptionalAiConfig {
  return saveOptionalAiConfig({ ...DEFAULT_OPTIONAL_AI_CONFIG });
}

export function isOptionalAiReady(config: OptionalAiConfig): boolean {
  return config.provider !== 'none' && config.apiKey.trim().length > 8;
}

export interface GeneratedSectionProposal {
  prose: string;
  bullets: string[];
  formulas: string[];
  modelUsed: string;
  warnings: string[];
}

function buildAcademicPrompt(opts: {
  topic: SyllabusTopicNode;
  subject: SyllabusSubjectNode;
  section: EnrichmentSectionBlueprint;
  existingContentSummary: string;
}): string {
  const { topic, subject, section, existingContentSummary } = opts;
  return [
    'You are assisting a B.Pharm Semester I academic editor writing concise, university-grade pharmaceutical science content.',
    'STRICT ACCURACY RULES:',
    '- NEVER invent or fabricate references, DOIs, ISBNs, journal names, page numbers, or clinical trial statistics.',
    '- Only state well-established foundational pharmacy, anatomy, chemistry, pharmacognosy, or biopharmaceutics facts.',
    '- If a specific pharmacopoeial limit or dosage constant depends on edition/species, write [VERIFY WITH PHARMACOPOEIA/TEXTBOOK] rather than guessing.',
    '- Keep tone clean, structured, academic, and free of hype.',
    '',
    `Course Subject: ${subject.code} — ${subject.title}`,
    `Unit: ${topic.unitNo} (${topic.unitTitle})`,
    `Topic: ${topic.title}`,
    `Subtopics: ${topic.subtopics.map((s) => s.title).join('; ') || 'General topic scope'}`,
    `Target Section: ${section.label}`,
    `Section Objective: ${section.authoringPrompt}`,
    existingContentSummary
      ? `Existing Content Already Present (expand without repeating verbatim):\n${existingContentSummary.slice(0, 900)}`
      : 'Existing Content: None for this section yet.',
    '',
    'Respond ONLY with valid JSON matching this schema:',
    '{"prose": "2-4 clear academic paragraphs", "bullets": ["concise bullet 1", "concise bullet 2"], "formulas": ["optional formula or equation if quantitative section"]}'
  ].join('\n');
}

function parseJsonProposal(rawText: string, modelUsed: string): GeneratedSectionProposal {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  const slice = jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;

  try {
    const parsed = JSON.parse(slice) as {
      prose?: unknown;
      bullets?: unknown;
      formulas?: unknown;
    };
    const prose = typeof parsed.prose === 'string' ? parsed.prose.trim() : '';
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.filter((b): b is string => typeof b === 'string' && b.trim().length > 0).map((b) => b.trim())
      : [];
    const formulas = Array.isArray(parsed.formulas)
      ? parsed.formulas.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).map((f) => f.trim())
      : [];
    return {
      prose,
      bullets,
      formulas,
      modelUsed,
      warnings: [
        'AI-generated draft is unverified until you inspect scientific accuracy and attach authoritative references.'
      ]
    };
  } catch {
    return {
      prose: rawText.trim(),
      bullets: [],
      formulas: [],
      modelUsed,
      warnings: [
        'AI response returned plain text rather than JSON; review and edit carefully before accepting.'
      ]
    };
  }
}

export async function generateOptionalAiSectionDraft(opts: {
  config: OptionalAiConfig;
  topic: SyllabusTopicNode;
  subject: SyllabusSubjectNode;
  section: EnrichmentSectionBlueprint;
  existingContentSummary: string;
}): Promise<GeneratedSectionProposal> {
  const { config, topic, subject, section, existingContentSummary } = opts;

  if (!isOptionalAiReady(config)) {
    throw new Error('Optional AI assistance is not configured. Manual editing requires no API key.');
  }

  const prompt = buildAcademicPrompt({ topic, subject, section, existingContentSummary });

  if (config.provider === 'gemini') {
    const model = encodeURIComponent(config.model || 'gemini-2.5-flash');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      config.apiKey.trim()
    )}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1200
        }
      })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini request failed (${res.status}): ${errText.slice(0, 180) || res.statusText}`);
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text.trim()) throw new Error('Gemini returned an empty draft response.');
    return parseJsonProposal(text, config.model);
  }

  // OpenAI-compatible client-side BYOK endpoint
  const res = await fetch(config.endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey.trim()}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      temperature: 0.25,
      messages: [
        {
          role: 'system',
          content:
            'You are a careful B.Pharm academic editor. Never invent citations, DOIs, or unverified numeric claims.'
        },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`BYOK endpoint failed (${res.status}): ${errText.slice(0, 180) || res.statusText}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content || '';
  if (!text.trim()) throw new Error('Endpoint returned an empty draft response.');
  return parseJsonProposal(text, config.model);
}
