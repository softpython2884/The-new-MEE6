'use server';

/**
 * @fileOverview An AI agent that translates text to a target language.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AutoTranslateInputSchema = z.object({
  textToTranslate: z.string().describe('The text that needs to be translated.'),
  targetLanguage: z.string().describe('The target language for translation (e.g., "French").'),
});

const AutoTranslateOutputSchema = z.object({
  translationNeeded: z.boolean().describe('Whether a translation is actually needed (i.e., the original text was not already in the target language).'),
  translatedText: z.string().describe('The translated text. Empty if translation is not needed.'),
});

export type AutoTranslateInput = z.infer<typeof AutoTranslateInputSchema>;
export type AutoTranslateOutput = z.infer<typeof AutoTranslateOutputSchema>;

export async function autoTranslateFlow(input: AutoTranslateInput): Promise<AutoTranslateOutput> {
  return flow(input);
}

const translatePrompt = ai.definePrompt({
  name: 'translatePrompt',
  input: { schema: AutoTranslateInputSchema },
  output: { schema: AutoTranslateOutputSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are a translation expert. Your task is to translate a given text into a target language.

First, detect the language of the source text.
If the source text is ALREADY in the {{{targetLanguage}}}, then set 'translationNeeded' to false and return an empty string for 'translatedText'.
Otherwise, translate the text into {{{targetLanguage}}}, set 'translationNeeded' to true, and provide the translation in 'translatedText'.

Target Language: {{{targetLanguage}}}
Text to Translate: "{{{textToTranslate}}}"
`,
});

const flow = ai.defineFlow(
  {
    name: 'autoTranslateFlow',
    inputSchema: AutoTranslateInputSchema,
    outputSchema: AutoTranslateOutputSchema,
  },
  async (input) => {
    // For very short texts, translation might not be reliable.
    if (input.textToTranslate.trim().split(/\s+/).length < 2) {
        return { translationNeeded: false, translatedText: '' };
    }
    
    const { output } = await translatePrompt(input);
    return output!;
  }
);
