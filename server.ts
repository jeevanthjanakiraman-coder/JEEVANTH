import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  validateChatRequest,
  validateToolRequest,
  buildToolPrompt,
  VALID_TOOLS,
  normalizeConversation,
} from './src/utils/api-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS headers for API calls
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const quotaExhaustedMap: Record<string, number> = {
  // Free-tier 20 RPD daily limit reached on 3.8-flash; mark exhausted to immediately use flash-lite
  'gemini-3.8-flash': Date.now() + 2 * 60 * 60 * 1000,
  'gemini-flash-latest': Date.now() + 2 * 60 * 60 * 1000,
};

function getAvailableModels(): string[] {
  const now = Date.now();
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  return candidateModels.sort((a, b) => {
    const aExhausted = (quotaExhaustedMap[a] || 0) > now;
    const bExhausted = (quotaExhaustedMap[b] || 0) > now;
    if (aExhausted === bExhausted) return 0;
    return aExhausted ? 1 : -1;
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentWithFallback(params: {
  contents: any;
  systemInstruction?: string;
}) {
  const modelsToTry = getAvailableModels();
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.systemInstruction
          ? { systemInstruction: params.systemInstruction }
          : undefined,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Attempt ${i + 1}] Model ${model} error:`, errMsg);

      if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
        // Mark model exhausted for 2 hours to avoid wasting time on retries
        quotaExhaustedMap[model] = Date.now() + 2 * 60 * 60 * 1000;
        continue;
      }

      if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE')) {
        await sleep(500);
      }
    }
  }

  throw lastError;
}

// --- GET /api/status ---
app.get('/api/status', (req: Request, res: Response) => {
  const activeModel = getAvailableModels()[0];
  res.json({
    status: 'operational',
    service: 'Jeevanth AI API',
    version: '1.0.0',
    model: activeModel,
    hasApiKey: Boolean(apiKey),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    supportedTools: VALID_TOOLS,
    endpoints: [
      { path: '/api/chat', method: 'POST', description: 'Interactive multi-turn or single-turn chat with streaming option' },
      { path: '/api/tools/:tool', method: 'POST', description: `Execute studio tools (${VALID_TOOLS.join(', ')})` },
      { path: '/api/status', method: 'GET', description: 'Service health and environment status' },
      { path: '/api/docs', method: 'GET', description: 'Full API documentation schema' },
    ],
  });
});

// --- GET /api/docs ---
app.get('/api/docs', (req: Request, res: Response) => {
  const activeModel = getAvailableModels()[0];
  res.json({
    title: 'Jeevanth AI API Reference',
    description: 'REST API for conversational intelligence and specialized AI studio tools powered by Google Gemini.',
    version: '1.0.0',
    baseUrl: process.env.APP_URL || 'http://localhost:3000',
    defaultModel: activeModel,
    endpoints: {
      chat: {
        path: '/api/chat',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          message: 'string (optional if messages array is provided)',
          messages: 'Array<{ role: "user" | "assistant" | "system", content: string }> (optional)',
          systemInstruction: 'string (optional system prompt)',
          stream: 'boolean (optional, default false)',
        },
        sampleResponse: {
          role: 'assistant',
          text: 'Hello! How can I help you today?',
          model: activeModel,
        },
      },
      tools: {
        path: '/api/tools/:tool',
        method: 'POST',
        params: {
          tool: `One of: ${VALID_TOOLS.join(', ')}`,
        },
        headers: { 'Content-Type': 'application/json' },
        body: {
          input: 'string (required text or prompt)',
          tone: 'string (for writing: Friendly, Formal, Creative, Simple, Persuasive)',
          targetLang: 'string (for translate: Tamil, Hindi, French, Spanish, Japanese, German, etc.)',
          codeLang: 'string (for code: Python, TypeScript, React, Go, Rust, Java, etc.)',
          summaryFormat: 'string (bullets, executive, tldr, action_items)',
          style: 'string (for image: Cinematic, Photorealistic, Anime, Minimalist, 3D Render)',
          complexity: 'string (for study: Beginner, High School, College, Expert)',
        },
        sampleResponse: {
          tool: 'image',
          result: 'Enhanced prompt details...',
          model: activeModel,
        },
      },
      status: {
        path: '/api/status',
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      },
    },
  });
});

// --- POST /api/chat ---
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(503).json({
      error: 'Gemini API key is not configured on the server. Please verify your API key in the Secrets panel.',
    });
    return;
  }

  const validation = validateChatRequest(req.body);
  if (!validation.valid || !validation.messages) {
    res.status(400).json({ error: validation.error || 'Invalid chat request' });
    return;
  }

  const systemInstruction =
    typeof req.body.systemInstruction === 'string' && req.body.systemInstruction.trim()
      ? req.body.systemInstruction.trim()
      : 'You are Jeevanth AI, an intelligent, helpful, articulate, and friendly AI assistant. Format your responses with clear markdown, readable headings, code blocks with syntax tags when relevant, and concise actionable explanations.';

  const isStream = req.body.stream === true || req.headers.accept === 'text/event-stream';

  try {
    // Map conversation messages into compliant, alternating Gemini contents format
    const contents = normalizeConversation(validation.messages);

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const activeModel = getAvailableModels()[0];
      const streamResponse = await ai.models.generateContentStream({
        model: activeModel,
        contents,
        config: {
          systemInstruction,
        },
      });

      for await (const chunk of streamResponse) {
        const chunkText = chunk.text || '';
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const { response, modelUsed } = await generateContentWithFallback({
      contents,
      systemInstruction,
    });

    const responseText = response.text || '';
    res.json({
      role: 'assistant',
      text: responseText,
      model: modelUsed,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    const message = error?.message || 'Failed to generate response from Gemini API';
    if (!res.headersSent) {
      res.status(500).json({
        error: message,
        model: getAvailableModels()[0],
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
});

// --- POST /api/tools/:tool ---
app.post('/api/tools/:tool', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(503).json({
      error: 'Gemini API key is not configured on the server. Please verify your API key in the Secrets panel.',
    });
    return;
  }

  const toolParam = req.params.tool;
  const validation = validateToolRequest(toolParam, req.body);

  if (!validation.valid || !validation.tool || !validation.input) {
    res.status(400).json({ error: validation.error || 'Invalid tool request' });
    return;
  }

  const { tool, input, options } = validation;
  const promptConfig = buildToolPrompt(tool, input, options);

  try {
    const { response, modelUsed } = await generateContentWithFallback({
      contents: promptConfig.userPrompt,
      systemInstruction: promptConfig.systemInstruction,
    });

    const resultText = response.text || '';
    res.json({
      tool,
      input,
      result: resultText,
      model: modelUsed,
      options,
    });
  } catch (error: any) {
    console.error(`Tool ${toolParam} API Error:`, error);
    res.status(500).json({
      error: error?.message || `Failed to execute ${toolParam} tool`,
      tool: toolParam,
      model: getAvailableModels()[0],
    });
  }
});

// --- Vite / Static Middleware Setup ---
const PORT = 3000;

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jeevanth AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
