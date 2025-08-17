
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
  title: z.string().describe('A short, descriptive title for the content (e.g., "Nouvelle Règle : Respect").'),
  generatedText: z.string().describe('The generated text content, formatted with Discord markdown.'),
});

export type TextContentInput = z.infer<typeof TextContentInputSchema>;
export type TextContentOutput = z.infer<typeof TextContentOutputSchema>;

const textGenPrompt = ai.definePrompt({
    name: 'textContentPrompt',
    input: { schema: TextContentInputSchema },
    output: { schema: TextContentOutputSchema },
    model: 'googleai/gemini-2.0-flash',
    prompt: `You are a creative writer and community manager for a Discord server.
Your task is to write a piece of content based on a specified type and topic.

Content Type: {{{type}}}
Topic: "{{{topic}}}"
Tone: {{{tone}}}
{{#if customInstructions}}
Custom Instructions: {{{customInstructions}}}
{{/if}}

Please generate a short, descriptive title for the content, and the content itself.
Ensure the content is well-written, engaging, and perfectly suited for a Discord community. Format it appropriately using Discord markdown (like **bold** or *italics*) where necessary.
For a rule, the title should be like "📝 Règle : [Sujet]".
For an announcement, the title should be like "📢 Annonce : [Sujet]".
`,
});

export async function generateTextContent(input: TextContentInput): Promise<TextContentOutput> {
  const { output } = await textGenPrompt(input);
  return output!;
}


// --- Image Generation ---

const ImageGenInputSchema = z.object({
    prompt: z.string().describe('A detailed description of the image to generate.'),
    allow_nsfw: z.boolean().optional().describe('Whether to allow NSFW content generation.'),
});

const ImageGenOutputSchema = z.object({
    imageDataUri: z.string().optional().describe('The generated image as a data URI.'),
});

export type ImageGenInput = z.infer<typeof ImageGenInputSchema>;
export type ImageGenOutput = z.infer<typeof ImageGenOutputSchema>;

export async function generateImage(input: ImageGenInput): Promise<ImageGenOutput> {
    const safetySettings = input.allow_nsfw 
        ? [{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }]
        : [];

    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
            responseModalities: ['IMAGE', 'TEXT'],
            safetySettings,
        },
    });

    if (media?.url) {
        return { imageDataUri: media.url };
    }

    return { imageDataUri: undefined };
}
