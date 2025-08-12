
'use server';

/**
 * @fileOverview An AI agent that analyzes messages for toxic content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerationAiInputSchema = z.object({
  messageContent: z.string().describe('The message content to analyze.'),
});

const ModerationAiOutputSchema = z.object({
  isToxic: z.boolean().describe('Whether the message is considered toxic or not.'),
  reason: z.string().describe('A brief, user-friendly reason for the moderation decision (e.g., "Insultant", "Discours haineux"). Empty if not toxic.'),
  severity: z.enum(['low', 'medium', 'high']).describe('The severity of the toxicity. Default to "low" if not applicable.'),
});

export type ModerationAiInput = z.infer<typeof ModerationAiInputSchema>;
export type ModerationAiOutput = z.infer<typeof ModerationAiOutputSchema>;

export async function moderationAiFlow(input: ModerationAiInput): Promise<ModerationAiOutput> {
  return flow(input);
}

const filterPrompt = ai.definePrompt({
  name: 'moderationAiPrompt',
  input: { schema: ModerationAiInputSchema },
  output: { schema: ModerationAiOutputSchema },
  prompt: `You are an expert content moderator for a Discord server. Your task is to analyze a user's message for any toxic content.

You must consider the following categories for toxic content:
- Insults, personal attacks, and harassment
- Hate speech, racism, and discrimination
- Severe profanity and explicit language
- Threats of violence

Analyze the following message.
- If the message is toxic, set 'isToxic' to true, provide a concise reason, and determine a severity level ('low', 'medium', 'high').
- If the message is clean, set 'isToxic' to false.

Message to analyze: "{{{messageContent}}}"
`,
});

const flow = ai.defineFlow(
  {
    name: 'moderationAiFlow',
    inputSchema: ModerationAiInputSchema,
    outputSchema: ModerationAiOutputSchema,
  },
  async (input) => {
    // Prevent analyzing very short, non-toxic messages
    if (input.messageContent.length < 5 && !/[*@_~`|]/.test(input.messageContent)) {
        return { isToxic: false, reason: '', severity: 'low' };
    }
    const { output } = await filterPrompt(input);
    return output!;
  }
);
