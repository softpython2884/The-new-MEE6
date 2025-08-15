
'use server';

/**
 * @fileOverview An AI agent that analyzes messages for toxic content and suggests moderation actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerationAiInputSchema = z.object({
  messageContent: z.string().describe('The message content to analyze.'),
});

const ModerationAiOutputSchema = z.object({
  isToxic: z.boolean().describe('Whether the message is considered toxic or not.'),
  reason: z.string().describe('A brief, user-friendly reason for the moderation decision (e.g., "Insultant", "Discours haineux"). Empty if not toxic.'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe('The severity of the toxicity. Default to "low" if not applicable.'),
  suggestedAction: z.enum(['none', 'warn', 'delete', 'mute', 'kick', 'ban']).describe("The suggested moderation action."),
  suggestedDuration: z.string().optional().describe("The suggested duration for a mute action (e.g., '5m', '1h', '24h'). Empty if not applicable.")
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
  prompt: `You are an expert content moderator for a Discord server. Your task is to analyze a user's message for any toxic content and suggest a fair and proportionate action.

You must consider the following categories for toxic content:
- Insults, personal attacks, and harassment
- Hate speech, racism, and discrimination
- Severe profanity and explicit language
- Spam or advertising
- Threats of violence or self-harm

Analyze the following message.
- If the message is toxic, set 'isToxic' to true, provide a concise reason, and determine a severity level ('low', 'medium', 'high', 'critical').
- Based on the severity, suggest a proportionate action ('warn', 'delete', 'mute', 'kick', 'ban').
- If the action is 'mute', suggest a reasonable duration (e.g., '5m', '1h', '24h').
- If the message is clean, set 'isToxic' to false and the action to 'none'.

Severity Guide:
- low: Minor insults, borderline profanity. Action: warn or delete.
- medium: Clear insults, spam, harassment. Action: mute for 5-10 minutes.
- high: Hate speech, repeated harassment, significant toxicity. Action: mute for 1-24 hours.
- critical: Direct threats, severe hate speech, doxing. Action: ban.

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
        return { isToxic: false, reason: '', severity: 'low', suggestedAction: 'none' };
    }
    const { output } = await filterPrompt(input);
    return output!;
  }
);
