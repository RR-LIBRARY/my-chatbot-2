// --- START OF index.js for Render ---

import express from 'express';
import cors from 'cors';
import { HfInference } from "@huggingface/inference";
import path from 'path'; // path module import karna zaroori hai
import { fileURLToPath } from 'url'; // URL se path banane ke liye zaroori hai

// --- Hugging Face Setup ---
// !! IMPORTANT !!: Yeh HF_TOKEN Render mein Environment Variable ke taur par set hona chahiye!
const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error("!!! FATAL ERROR: Hugging Face Token (HF_TOKEN) environment variable not found!");
  console.error("Please set HF_TOKEN in Render Environment Variables.");
  process.exit(1); // Token ke bina server start na ho
}
const client = new HfInference(HF_TOKEN);
// --- End Hugging Face Setup ---

// --- Express Server Setup ---
const app = express();
// !! IMPORTANT !!: Render is PORT environment variable ko set karega.
const PORT = process.env.PORT || 3000; // Default 3000 local ke liye

// __dirname ko ES Modules mein define karna (Aapka original code sahi tha)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS ko enable karein (abhi sabhi ko allow kar rahe hain)
// Production mein Netlify URL specify karna behtar hai:
// const corsOptions = { origin: 'YOUR_NETLIFY_APP_URL' }; app.use(cors(corsOptions));
app.use(cors());

// JSON requests ko parse karne ke liye middleware
app.use(express.json());
// --- End Express Server Setup ---

// --- API Endpoint for Chat (/api/chat) ---
app.post('/api/chat', async (req, res) => {
  const userInput = req.body.message;
  if (!userInput) {
    return res.status(400).json({ error: 'Request body must contain a "message" field.' });
  }
  console.log(`Received message for chat API: "${userInput}"`); // Log incoming message

  try {
    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Start streaming from Hugging Face model
    const stream = client.chatCompletionStream({
      model: "deepseek-ai/DeepSeek-V3-0324", // Ensure this model is accessible with your token/provider
      provider: "fireworks-ai",             // Check if this provider is needed or remove if using HF directly
      temperature: 0.4,
      max_tokens: 512,
      top_p: 0.7,
      messages: [{ role: "user", content: userInput }],
    });

    // Process the stream chunk by chunk
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        res.write(chunk.choices[0].delta.content); // Write content chunk to response
      }
      if (chunk.choices?.[0]?.finish_reason) {
        break; // Stop if the model indicates completion
      }
    }
    res.end(); // End the response stream
    console.log('Finished sending streaming response.');

  } catch (error) {
    console.error("\nError during API call or streaming:", error); // Log the full error
    if (!res.headersSent) {
       // If no headers sent yet, send a JSON error
       res.status(500).json({ error: 'Failed to process chat message due to an internal error.' });
    } else {
       // If headers already sent (mid-stream error), just end the response
       res.end();
    }
  }
});
// --- End API Endpoint ---

// --- Serve Frontend ---
// !! IMPORTANT !!: Static files (CSS, script.js) ko root directory se serve karein
// Yeh maan raha hai ki index.html, style.css, script.js sab root mein hain
app.use(express.static(path.join(__dirname)));

// Root URL ('/') par index.html file serve karein
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Error sending index.html:", err);
            res.status(500).send("Could not find index.html");
        }
    });
});
// --- End Frontend Route ---

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`); // Log server start
  // Log message to check in Render logs
  console.log(`Server should be accessible via Render URL.`);
});
// --- End Start Server ---

// --- END OF index.js for Render ---
