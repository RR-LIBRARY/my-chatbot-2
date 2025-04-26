// --- START OF index.js for Render (No Comments) ---

import express from 'express';
import cors from 'cors';
import { HfInference } from "@huggingface/inference";
import path from 'path';
import { fileURLToPath } from 'url';

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error("!!! FATAL ERROR: Hugging Face Token (HF_TOKEN) environment variable not found!");
  console.error("Please set HF_TOKEN in Render Environment Variables.");
  process.exit(1);
}
const client = new HfInference(HF_TOKEN);

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const userInput = req.body.message;

  console.log("Request Body Received:", JSON.stringify(req.body));

  if (!userInput) {
    console.error("!!! ERROR: Request body missing 'message' field.");
    return res.status(400).json({ error: 'Request body must contain a "message" field.' });
  }
  console.log(`Received message for chat API: "${userInput}"`);

  try {
    console.log("Attempting to call Hugging Face API...");
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const stream = client.chatCompletionStream({
      model: "deepseek-ai/DeepSeek-V3-0324",
      provider: "fireworks-ai",
      temperature: 0.4,
      max_tokens: 512,
      top_p: 0.7,
      messages: [{ role: "user", content: userInput }],
    });

    console.log("Streaming response started...");
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        res.write(chunk.choices[0].delta.content);
      }
      if (chunk.choices?.[0]?.finish_reason) {
        console.log("Stream finished with reason:", chunk.choices[0].finish_reason);
        break;
      }
    }
    res.end();
    console.log('Finished sending streaming response.');

  } catch (error) {
    console.error("\n!!!!!!!! ERROR CAUGHT IN /api/chat !!!!!!!!");
    console.error("Error Message:", error.message);
    console.error("Error Stack Trace:", error.stack);

    if (error.response) {
      console.error("--- Underlying HTTP Response Error Details ---");
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
      console.error("--------------------------------------------");
    }

    console.error("Full Error Object Structure:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    if (!res.headersSent) {
       console.log("Sending 500 error response back to client.");
       res.status(500).json({ error: 'Failed to process chat message due to an internal server error.' });
    } else {
       console.log("Headers already sent, ending response after error.");
       res.end();
    }
  }
});

app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Error sending index.html:", err);
            res.status(500).send("Could not find index.html");
        }
    });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
  console.log(`Server should be accessible via Render URL.`);
});

// --- END OF index.js for Render (No Comments) ---
