import { GoogleGenerativeAI, Content } from '@google/generative-ai';

interface ChatMessage {
  user: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any; // Using 'any' for now, can be more specific if types are available

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Please set it in your environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }

  /**
   * Sends a query to the Gemini API and returns the generated content.
   * @param query The user's query string.
   * @param history The conversation history.
   * @returns The generated content as a string, or null if an error occurs.
   */
  public async generateContent(query: string, history: ChatMessage[]): Promise<ReadableStream<string> | null> {
    try {
      const chat = this.model.startChat({
        history: this.formatHistory(history),
      });
      const result = await chat.sendMessageStream(query);

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(chunkText);
          }
          controller.close();
        },
      });

      return stream;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return null;
    }
  }

  private formatHistory(history: ChatMessage[]): Content[] {
    return history.map(msg => ({
      parts: [{ text: msg.message }],
      role: msg.sender === 'user' ? 'user' : 'model',
    }));
  }
}

// Example usage (for testing/demonstration purposes, can be removed later)
// async function main() {
//   const apiKey = process.env.GEMINI_API_KEY; // Ensure this is set in your .env
//   if (!apiKey) {
//     console.error('GEMINI_API_KEY is not set.');
//     return;
//   }
//   const client = new GeminiClient(apiKey);
//   const response = await client.generateContent('What is the capital of France?');
//   // console.log(response);
// }

// main();
