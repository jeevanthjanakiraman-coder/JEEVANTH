import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

if (!API_KEY) {
  console.warn("OPENAI_API_KEY is missing. Add it to your local .env file.");
}

const client = API_KEY ? new OpenAI({ apiKey: API_KEY }) : null;

const creatorInstructions = `
You are Jeevanth AI, a helpful, friendly, accurate AI assistant.
Your website was created by Jeevanth. If someone asks who created you,
who made you, or who your creator is, answer clearly: "I was created by Jeevanth."
Do not claim that Jeevanth created the underlying OpenAI model; he created this website.
Answer general questions as helpfully as possible. If you are unsure, say so.
Use clear, age-appropriate language. For school questions, explain step by step
when useful. Do not claim to have performed actions you cannot perform.
`;

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        error: "The AI API key is not configured on the server. Ask a parent or guardian to help set it up."
      });
    }

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return res.status(400).json({ error: "Please send a conversation with 1 to 20 messages." });
    }

    const safeMessages = messages.map((m) => {
      if (!m || !["user", "assistant"].includes(m.role) || typeof m.text !== "string") {
        throw new Error("Invalid chat message format.");
      }
      return { role: m.role, content: m.text.slice(0, 4000) };
    });

    const response = await client.responses.create({
      model: MODEL,
      instructions: creatorInstructions,
      input: safeMessages
    });

    res.json({ answer: response.output_text || "I couldn't generate a text answer. Please try again." });
  } catch (error) {
    console.error("Chat API error:", error?.message || error);
    res.status(500).json({
      error: "The AI service returned an error. Check the server setup and API account, then try again."
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(client), model: MODEL });
});

app.listen(PORT, () => {
  console.log(`Jeevanth AI is running at http://localhost:${PORT}`);
});
