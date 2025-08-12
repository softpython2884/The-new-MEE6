
'use server';

/**
 * @fileOverview AI flows for generating creative content like announcements, rules, and images.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Text Generation ---

const TextContentInputSchema = z.object({
  type: z.enum(['rule', 'announcement']).describe('The type of content to generate.'),
  topic: z.string().describe('The specific topic for the content.'),
  tone: z.enum(['familiar', 'professional', 'narrative']).describe('The desired tone for the text.'),
  customInstructions: z.string().optional().describe('Optional custom instructions to further guide the AI.'),
});

const TextContentOutputSchema = z.object({
  generatedText: z.string().describe('The generated text content.'),
});

export type TextContentInput = z.infer<typeof TextContentInputSchema>;
export type TextContentOutput = z.infer<typeof TextContentOutputSchema>;

const textGenPrompt = ai.definePrompt({
    name: 'textContentPrompt',
    input: { schema: TextContentInputSchema },
    output: { schema: TextContentOutputSchema },
    prompt: `You are a creative writer and community manager for a Discord server.
Your task is to write a piece of content based on a specified type and topic.

Content Type: {{{type}}}
Topic: "{{{topic}}}"
Tone: {{{tone}}}
{{#if customInstructions}}
Custom Instructions: {{{customInstructions}}}
{{/if}}

Please generate the content now. Ensure it is well-written, engaging, and perfectly suited for a Discord community. Format it appropriately using Discord markdown (like **bold** or *italics*) where necessary.
`,
});

export async function generateTextContent(input: TextContentInput): Promise<TextContentOutput> {
  const { output } = await textGenPrompt(input);
  return output!;
}


// --- Image Generation ---

const ImageGenInputSchema = z.object({
    prompt: z.string().describe('A detailed description of the image to generate.'),
});

const ImageGenOutputSchema = z.object({
    imageDataUri: z.string().optional().describe('The generated image as a data URI.'),
});

export type ImageGenInput = z.infer<typeof ImageGenInputSchema>;
export type ImageGenOutput = z.infer<typeof ImageGenOutputSchema>;

export async function generateImage(input: ImageGenInput): Promise<ImageGenOutput> {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
            responseModalities: ['IMAGE'],
        },
    });

    if (media.url) {
        return { imageDataUri: media.url };
    }

    return { imageDataUri: undefined };
}
