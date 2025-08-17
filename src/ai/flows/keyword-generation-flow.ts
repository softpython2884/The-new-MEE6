
'use server';

/**
 * @fileOverview An AI flow for generating a list of keywords based on a prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Keyword Generation ---

const KeywordGenInputSchema = z.object({
  prompt: z.string().describe('A description of the types of keywords to generate (e.g., "Mots insultants en français", "Arnaques de crypto-monnaie en anglais").'),
});

const KeywordGenOutputSchema = z.object({
  keywords: z.array(z.string()).describe('An array of generated keywords, ready to be used in a filter. The keywords should be in lowercase.'),
});

export type KeywordGenInput = z.infer<typeof KeywordGenInputSchema>;
export type KeywordGenOutput = z.infer<typeof KeywordGenOutputSchema>;

const keywordGenPrompt = ai.definePrompt({
    name: 'keywordGenPrompt',
    input: { schema: KeywordGenInputSchema },
    output: { schema: KeywordGenOutputSchema },
    model: 'googleai/gemini-2.0-flash',
    prompt: `You are an expert in content moderation and linguistics.
Your task is to generate a list of keywords based on a user's request.
The list should be comprehensive and include common variations, slang, and related terms.
The keywords should all be in lowercase. Do not include any special characters or wildcards.

User Request: "{{{prompt}}}"

Generate the list of keywords now.
`,
});

export async function generateKeywords(input: KeywordGenInput): Promise<KeywordGenOutput> {
  const { output } = await keywordGenPrompt(input);
  return output!;
}
