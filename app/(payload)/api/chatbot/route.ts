import { NextRequest } from 'next/server';
import { ChatbotService } from '../../../../lib/chatbot/ChatbotService';
import { getPayload } from 'payload';
import config from '../../../../payload.config';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY is not set. Please set it in your environment variables.');
}

const chatbotService = new ChatbotService(geminiApiKey);

export async function POST(req: NextRequest) {
  try {
    // Initialize Payload if not already initialized
    const payload = await getPayload({ config });

    const { message, userId } = await req.json();

    if (!message || !userId) {
      return new Response(JSON.stringify({ error: 'Message and userId are required' }), { status: 400 });
    }

    const stream = await chatbotService.processMessage(message, userId);

    if (stream) {
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache, no-transform',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Failed to get response from Gemini.' }), { status: 500 });
    }
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}