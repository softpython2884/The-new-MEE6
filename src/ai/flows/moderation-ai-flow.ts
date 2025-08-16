
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

Your Core Directives:
1.  **Context is King:** You are moderating a real, live community. Understand French internet slang, abbreviations (like 'mdr', 'wtf'), humor, sarcasm, and frustration. Do not be a robot.
2.  **Focus on User-to-User Harm:** Prioritize flagging messages that are harmful from one user to another. Criticisms or jokes aimed at the bot itself (like "Mange le sol Marcus") should generally be ignored unless they are extremely vulgar.
3.  **Ignore Benign Content:** Do NOT flag the following:
    - Simple spelling mistakes or grammatical errors (e.g., "il et pas bon").
    - Common chat acronyms.
    - Mild expressions of frustration or disappointment.
    - Sarcasm or irony that isn't a direct personal attack.
    - Messages that are too short or ambiguous to be definitively toxic.
4.  **When in Doubt, Do Nothing:** If a message is borderline or could be interpreted in multiple ways, err on the side of caution and set 'isToxic' to false. It's better to miss a borderline case than to incorrectly punish an innocent user.

Sensitivity Level: {{{sensitivity}}}
- 'low': Be very lenient. Only flag clear, unambiguous, and severe cases of toxicity (e.g., direct, hateful insults, racism, explicit threats). Ignore almost everything else.
- 'medium': A balanced approach. Flag clear insults and harassment. Be very critical of flagging sarcasm or simple frustration. Still ignore messages aimed at the bot.
- 'high': Be stricter on user-to-user negativity, but maintain intelligence. Do NOT flag common chat errors. Flag repeated, targeted harassment or significant toxicity.

Analysis Process:
1.  Read the message: "{{{messageContent}}}"
2.  Assess the message against your Core Directives and the current sensitivity level.
3.  If and ONLY IF the message is clearly toxic under these rules, set 'isToxic' to true. Otherwise, set it to false.
4.  If toxic, provide a concise reason IN FRENCH (e.g., "Insulte directe", "Contenu haineux", "Harcèlement").
5.  If toxic, determine a severity level ('low', 'medium', 'high', 'critical').
6.  If toxic, suggest a proportionate action ('warn', 'delete', 'mute', 'kick', 'ban').
7.  If action is 'mute', suggest a reasonable duration (e.g., '5m', '1h', '24h').
8.  If the message is NOT toxic, set 'isToxic' to false and 'suggestedAction' to 'none'.

Example of what NOT to flag:
- "Bas oe c'est chiant" -> Not toxic.
- "*sort une AK47*" -> Not toxic (likely roleplay).
- "bête ou quoi" -> Borderline, do not flag unless it's part of targeted harassment.
- "Bande de petite gentilles personne" -> Sarcasm, not toxic.
- "m£rd£" -> Mild profanity, not a direct attack. Do not flag on 'low' or 'medium' sensitivity.

Example of what TO flag:
- "espèce de pute" -> isToxic: true, reason: "Insulte directe", severity: medium, action: mute.
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
    if (input.messageContent.length < 3 && !/[*@_~`|]/.test(input.messageContent)) {
        return { isToxic: false, reason: '', severity: 'low', suggestedAction: 'none' };
    }
    const { output } = await filterPrompt(input);
    return output!;
  }
);
