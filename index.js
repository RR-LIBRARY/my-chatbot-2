// --- START OF FINAL index.js CODE ---
import express from 'express';
import cors from 'cors';
import { HfInference } from "@huggingface/inference";
import path from 'path'; // path मॉड्यूल इम्पोर्ट करें
import { fileURLToPath } from 'url'; // URL से पाथ बनाने के लिए

// --- Hugging Face Setup ---
const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.error("!!! ज़रूरी: Hugging Face Token Replit Secrets में नहीं मिला!");
  process.exit(1);
}
const client = new HfInference(HF_TOKEN);
// --- End Hugging Face Setup ---

// --- Express Server Setup ---
const app = express();
const PORT = process.env.PORT || 3000;
// __dirname को ES Modules में डिफाइन करें
const __filename = fileURLToPath(import.meta.url);
