'use server';

/**
 * @fileOverview An AI agent that suggests optimal server configurations based on server size,
 * activity, and community type.
 *
 * - suggestServerConfiguration - A function that suggests server configurations.
 * - SuggestServerConfigurationInput - The input type for the suggestServerConfiguration function.
 * - SuggestServerConfigurationOutput - The return type for the suggestServerConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestServerConfigurationInputSchema = z.object({
  serverSize: z
    .string()
    .describe('The size of the server (e.g., small, medium, large).'),
  serverActivity: z
    .string()
    .describe('The level of activity on the server (e.g., low, medium, high).'),
  communityType: z
    .string()
    .describe('The type of community on the server (e.g., gaming, social, educational).'),
});
export type SuggestServerConfigurationInput = z.infer<
  typeof SuggestServerConfigurationInputSchema
>;

const SuggestServerConfigurationOutputSchema = z.object({
  moderationSettings: z.string().describe('Suggested moderation settings.'),
  welcomeMessage: z.string().describe('A suggested welcome message.'),
  autoModerationRules: z.string().describe('Suggested auto-moderation rules.'),
});
export type SuggestServerConfigurationOutput = z.infer<
  typeof SuggestServerConfigurationOutputSchema
>;

export async function suggestServerConfiguration(
  input: SuggestServerConfigurationInput
): Promise<SuggestServerConfigurationOutput> {
  return suggestServerConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestServerConfigurationPrompt',
  input: {schema: SuggestServerConfigurationInputSchema},
  output: {schema: SuggestServerConfigurationOutputSchema},
  prompt: `You are an expert Discord server configuration specialist.

Based on the server's size, activity, and community type, suggest optimal configurations for moderation settings, welcome messages, and auto-moderation rules.

Consider incorporating elements of established 'best practices' for server configuration where appropriate.

Server Size: {{{serverSize}}}
Server Activity: {{{serverActivity}}}
Community Type: {{{communityType}}}`,
});

const suggestServerConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestServerConfigurationFlow',
    inputSchema: SuggestServerConfigurationInputSchema,
    outputSchema: SuggestServerConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
