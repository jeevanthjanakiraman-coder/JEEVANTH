/**
 * Core utility functions for API request handling, validation,
 * prompt templating, and developer code generation.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolRequestOptions {
  tone?: string;
  targetLang?: string;
  codeLang?: string;
  summaryFormat?: 'bullets' | 'executive' | 'tldr' | 'action_items';
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  style?: string;
}

export function sanitizeInput(text: unknown, maxLength = 8000): string {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}

export function validateChatRequest(body: unknown): {
  valid: boolean;
  error?: string;
  messages?: ChatMessage[];
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  // Accept either `message` string (single turn) or `messages` array (conversation history)
  if (typeof b.message === 'string' && b.message.trim().length > 0) {
    return {
      valid: true,
      messages: [{ role: 'user', content: sanitizeInput(b.message) }],
    };
  }

  if (Array.isArray(b.messages)) {
    const validMessages: ChatMessage[] = [];
    for (const m of b.messages) {
      if (
        m &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant' || m.role === 'model' || m.role === 'system') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
      ) {
        validMessages.push({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: sanitizeInput(m.content),
        });
      }
    }

    if (validMessages.length === 0) {
      return { valid: false, error: 'At least one non-empty message is required' };
    }

    return { valid: true, messages: validMessages };
  }

  return { valid: false, error: 'Please provide either a "message" string or a "messages" array' };
}

export function normalizeConversation(
  messages: ChatMessage[]
): { role: 'user' | 'model'; parts: [{ text: string }] }[] {
  // 1. Filter out empty messages and UI error notices
  const clean = messages.filter(
    (m) =>
      m &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0 &&
      !m.content.trim().startsWith('⚠️')
  );

  // 2. Find first user message
  const firstUserIdx = clean.findIndex((m) => m.role === 'user');
  if (firstUserIdx === -1) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  const result: { role: 'user' | 'model'; parts: [{ text: string }] }[] = [];
  let expectedRole: 'user' | 'model' = 'user';

  for (let i = firstUserIdx; i < clean.length; i++) {
    const current = clean[i];
    const role: 'user' | 'model' =
      current.role === 'assistant' || (current.role as string) === 'model' ? 'model' : 'user';

    if (role === expectedRole) {
      result.push({ role, parts: [{ text: current.content }] });
      expectedRole = role === 'user' ? 'model' : 'user';
    } else if (result.length > 0 && role === result[result.length - 1].role) {
      // Merge consecutive same-role messages so alternation is preserved
      result[result.length - 1].parts[0].text += '\n\n' + current.content;
    }
  }

  return result.length > 0 ? result : [{ role: 'user', parts: [{ text: 'Hello' }] }];
}

export const VALID_TOOLS = ['image', 'writing', 'code', 'study', 'translate', 'summary'] as const;
export type ToolType = typeof VALID_TOOLS[number];

export function isValidTool(tool: string): tool is ToolType {
  return VALID_TOOLS.includes(tool as ToolType);
}

export function validateToolRequest(
  tool: string,
  body: unknown
): {
  valid: boolean;
  error?: string;
  tool?: ToolType;
  input?: string;
  options?: ToolRequestOptions;
} {
  if (!isValidTool(tool)) {
    return {
      valid: false,
      error: `Invalid tool "${tool}". Available tools: ${VALID_TOOLS.join(', ')}`,
    };
  }

  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;
  const input = sanitizeInput(b.input || b.prompt || b.text);

  if (!input) {
    return { valid: false, error: 'Missing required field: "input"' };
  }

  const options: ToolRequestOptions = {
    tone: typeof b.tone === 'string' ? sanitizeInput(b.tone, 50) : undefined,
    targetLang: typeof b.targetLang === 'string' ? sanitizeInput(b.targetLang, 50) : undefined,
    codeLang: typeof b.codeLang === 'string' ? sanitizeInput(b.codeLang, 50) : undefined,
    summaryFormat: typeof b.summaryFormat === 'string' ? (b.summaryFormat as ToolRequestOptions['summaryFormat']) : undefined,
    complexity: typeof b.complexity === 'string' ? (b.complexity as ToolRequestOptions['complexity']) : undefined,
    style: typeof b.style === 'string' ? sanitizeInput(b.style, 50) : undefined,
  };

  return { valid: true, tool, input, options };
}

export function buildToolPrompt(tool: ToolType, input: string, options: ToolRequestOptions = {}): {
  systemInstruction: string;
  userPrompt: string;
} {
  switch (tool) {
    case 'image':
      return {
        systemInstruction:
          'You are Jeevanth AI Image Studio Specialist. Your goal is to transform user ideas into production-ready, highly vivid image generation prompts. Structure your output clearly with: 1) Master Enhanced Prompt (photorealistic/artistic), 2) Visual Composition & Lighting, 3) Recommended Negative Prompt, and 4) Suggested Aspect Ratios and Camera Lenses.',
        userPrompt: `Idea / Subject: ${input}\nPreferred Style: ${options.style || 'Cinematic & Hyper-detailed'}`,
      };

    case 'writing':
      return {
        systemInstruction:
          'You are Jeevanth AI Writing Assistant. Produce polished, engaging, and well-structured writing. Emphasize clarity, compelling flow, and appropriate vocabulary.',
        userPrompt: `Topic / Brief: ${input}\nDesired Tone: ${options.tone || 'Friendly and professional'}\nComplexity: ${options.complexity || 'Intermediate'}`,
      };

    case 'code':
      return {
        systemInstruction:
          'You are Jeevanth AI Code Helper. Provide clean, well-commented, modern code with explanations, best practices, and edge cases considered. Use markdown code blocks with language identifiers.',
        userPrompt: `Task / Question: ${input}\nTarget Language / Stack: ${options.codeLang || 'TypeScript / JavaScript'}`,
      };

    case 'study':
      return {
        systemInstruction:
          'You are Jeevanth AI Study Buddy. Break complex academic concepts into intuitive explanations, memorable analogies, key definitions, and 3 quick self-check questions with answers.',
        userPrompt: `Topic / Subject: ${input}\nLevel: ${options.complexity || 'High School / College'}`,
      };

    case 'translate':
      return {
        systemInstruction:
          'You are Jeevanth AI Polyglot Translator. Deliver an accurate and natural translation into the requested language, accompanied by pronunciation tips, cultural nuance notes, and formality options (formal vs colloquial) if applicable.',
        userPrompt: `Text to translate:\n"""\n${input}\n"""\nTarget Language: ${options.targetLang || 'English'}`,
      };

    case 'summary':
      return {
        systemInstruction:
          'You are Jeevanth AI Quick Summary Specialist. Condense texts into high-signal, fluff-free summaries. Always organize into: 1) One-sentence TL;DR, 2) Key Bullet Points, 3) Decisions or Action Items.',
        userPrompt: `Text to summarize:\n"""\n${input}\n"""\nFormat style: ${options.summaryFormat || 'bullets and key takeaways'}`,
      };
  }
}

export function generateSnippet(
  type: 'curl' | 'js' | 'python',
  endpoint: string,
  method = 'POST',
  body?: Record<string, unknown>
): string {
  const url = endpoint.startsWith('http') ? endpoint : `http://localhost:3000${endpoint}`;
  const jsonBody = body ? JSON.stringify(body, null, 2) : '';

  if (type === 'curl') {
    if (method === 'GET') {
      return `curl -X GET "${url}" \\
  -H "Accept: application/json"`;
    }
    return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body)}'`;
  }

  if (type === 'js') {
    if (method === 'GET') {
      return `const response = await fetch("${url}");
const data = await response.json();
console.log(data);`;
    }
    return `const response = await fetch("${url}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${jsonBody})
});
const data = await response.json();
console.log(data);`;
  }

  if (type === 'python') {
    if (method === 'GET') {
      return `import requests

response = requests.get("${url}")
print(response.json())`;
    }
    return `import requests

payload = ${JSON.stringify(body, null, 4)}

response = requests.post("${url}", json=payload)
print(response.json())`;
  }

  return '';
}
