
'use server';

/**
 * @fileOverview An AI agent that analyzes messages for toxic content and suggests moderation actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerationAiInputSchema = z.object({
  messageContent: z.string().describe('The message content to analyze.'),
  sensitivity: z.enum(['low', 'medium', 'high']).describe('The sensitivity level for detection.'),
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
  prompt: `You are an expert content moderator for a French-speaking Discord server. Your task is to analyze a user's message for any toxic content and suggest a fair and proportionate action. You MUST provide your reasons in French.

You must consider the following categories for toxic content:
- Insults, personal attacks, and harassment
- Hate speech, racism, and discrimination
- Severe profanity and explicit language
- Spam or advertising
- Threats of violence or self-harm

IMPORTANT: You need to understand the nuances of online French conversation. Do not flag simple spelling mistakes, common slang (like "mdr"), or mild expressions of frustration as toxic. Be intelligent. A message like "ah... il et pas encore bon" is NOT toxic.

The user has set a sensitivity level for the moderation: {{{sensitivity}}}.
- 'low': Be very lenient. Only flag clear, unambiguous, and severe cases of toxicity (direct insults, hate speech). Ignore borderline cases, frustration, and most profanity.
- 'medium': A balanced approach. Flag clear insults and harassment, but ignore simple banter, expressions of frustration, or very mild profanity.
- 'high': Be stricter, but remain intelligent. Flag clear toxicity and repeated, targeted negativity. Do NOT flag simple spelling errors or common chat acronyms.

Analyze the following message.
- If the message is toxic based on the current sensitivity level, set 'isToxic' to true, provide a concise reason IN FRENCH (e.g., "Insulte directe", "Contenu haineux"), and determine a severity level ('low', 'medium', 'high', 'critical').
- Based on the severity, suggest a proportionate action ('warn', 'delete', 'mute', 'kick', 'ban').
- If the action is 'mute', suggest a reasonable duration (e.g., '5m', '1h', '24h').
- If the message is clean, set 'isToxic' to false and the action to 'none'.

Severity Guide (Examples):
- low: Minor insults, borderline profanity. Action: warn or delete.
- medium: Clear insults ("espèce de pute"), spam, harassment. Action: mute for 5-10 minutes.
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
