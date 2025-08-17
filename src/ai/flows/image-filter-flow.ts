
'use server';

/**
 * @fileOverview An AI agent that analyzes images for inappropriate content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageFilterInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  sensitivity: z
    .enum(['low', 'medium', 'high'])
    .describe('The sensitivity level for detection.'),
});

const ImageFilterOutputSchema = z.object({
  isCensored: z
    .boolean()
    .describe('Whether the image should be censored or not.'),
  reason: z
    .string()
    .describe('A brief, user-friendly reason for the censorship decision. Empty if not censored.'),
});

export type ImageFilterInput = z.infer<typeof ImageFilterInputSchema>;
export type ImageFilterOutput = z.infer<typeof ImageFilterOutputSchema>;

export async function imageFilterFlow(input: ImageFilterInput): Promise<ImageFilterOutput> {
  return flow(input);
}

const filterPrompt = ai.definePrompt({
  name: 'imageFilterPrompt',
  input: { schema: ImageFilterInputSchema },
  output: { schema: ImageFilterOutputSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are an expert content moderator for a Discord server. Your task is to analyze an image and determine if it is inappropriate.

You must consider the following categories for inappropriate content:
- Explicit Nudity or Sexual Content (NSFW)
- Graphic Violence or Gore
- Hateful Symbols or Imagery
- Depictions of illegal substances or activities

The user has set a sensitivity level for the moderation: {{{sensitivity}}}.
- 'low': Only censor the most explicit and unambiguous cases of NSFW or extreme gore.
- 'medium': Censor clear cases of nudity, violence, and hateful symbols. Be more cautious with suggestive content.
- 'high': Censor anything that could be considered remotely inappropriate, including suggestive clothing, minor violence (like in video games), and controversial symbols.

Based on your analysis and the sensitivity level, decide if the image should be censored.
- If it should be censored, set 'isCensored' to true and provide a concise, user-friendly reason (e.g., "Contenu sexuellement explicite", "Violence graphique", "Symbole haineux").
- If the image is safe, set 'isCensored' to false and leave the reason empty.

Image to analyze:
{{media url=photoDataUri}}
`,
});

const flow = ai.defineFlow(
  {
    name: 'imageFilterFlow',
    inputSchema: ImageFilterInputSchema,
    outputSchema: ImageFilterOutputSchema,
  },
  async (input) => {
    const { output } = await filterPrompt(input);
    return output!;
  }
);
