import { GeminiClient, ChatMessage } from '../gemini/GeminiClient';
import { getPortfolioData } from '../payload/getPortfolioData';

export class ChatbotService {
    private geminiClient: GeminiClient;

    constructor(geminiApiKey: string) {
        this.geminiClient = new GeminiClient(geminiApiKey);
    }

    private async fetchPortfolioData(): Promise<any | null> {
        try {
            return await getPortfolioData();
        } catch (error) {
            console.error('Error fetching portfolio data from Payload:', error);
            return null;
        }
    }

    async processMessage(message: string, userId: string): Promise<ReadableStream<string> | null> {
        try {
            const portfolioData = await this.fetchPortfolioData();
            const portfolioContext = portfolioData ? JSON.stringify(portfolioData, null, 2) : 'No portfolio data available.';

            const prompt = `You are an AI assistant for Ayush Srivastava's portfolio. Provide concise information about Ayush based on the following context. If the user asks a question that cannot be answered by the provided context, respond with "I only have information about Ayush Srivastava based on his portfolio data. I cannot answer that question."\n\nPortfolio Data: ${portfolioContext}\n\nUser: ${message}. response should not exceed 50 words.`;
            // console.log('Generated prompt:', prompt);

            const history: ChatMessage[] = []; // History will be managed on the client side

            const stream = await this.geminiClient.generateContent(prompt, history);

            if (stream) {
                return stream;
            } else {
                throw new Error('Failed to get response from Gemini.');
            }
        } catch (error) {
            console.error('Error processing message:', error);
            return null;
        }
    }
}