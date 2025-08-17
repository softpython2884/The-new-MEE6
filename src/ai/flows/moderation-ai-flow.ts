
'use server';

/**
 * @fileOverview An AI agent that analyzes messages for toxic content and suggests moderation actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { SanctionHistoryEntry } from '@/types';

const SanctionHistoryEntrySchema = z.object({
  action_type: z.string(),
  reason: z.string().optional(),
  timestamp: z.string(),
});

const ModerationAiInputSchema = z.object({
  messageContent: z.string().describe('The message content to analyze.'),
  userName: z.string().describe("The name of the user who sent the message."),
  conversationContext: z.array(z.string()).optional().describe("The last 5 messages in the channel for context."),
  userSanctionHistory: z.array(SanctionHistoryEntrySchema).optional().describe("The user's past sanctions on this server."),
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
    // Prevent analyzing very short, non-toxic messages
    if (input.messageContent.length < 3 && !/[*@_~`|]/.test(input.messageContent)) {
        return { isToxic: false, reason: '', severity: 'low', suggestedAction: 'none', suggestedDuration: undefined };
    }
  return flow(input);
}

const filterPrompt = ai.definePrompt({
  name: 'moderationAiPrompt',
  input: { schema: ModerationAiInputSchema },
  output: { schema: ModerationAiOutputSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are an expert content moderator for a French-speaking Discord server. Your task is to analyze a user's message for any toxic content and suggest a fair and proportionate action. You MUST provide your reasons in French.

Your Core Directives:
1.  **Context is King:** You are moderating a real, live community. Understand French internet slang, abbreviations, humor, sarcasm, and frustration. Use the provided conversation context to understand the flow of discussion.
2.  **Focus on User-to-User Harm:** Prioritize flagging messages that are harmful from one user to another. Criticisms or jokes aimed at the bot itself (like "Mange le sol Marcus" or "omg marcus t la ?") should generally be ignored unless they are extremely vulgar.
3.  **Be Cautious with Bot Commands:** Messages starting with prefixes like "!", "§", "%%", "?", "p!", "k!", or "^^" are *often* for other bots. However, users may try to hide insults behind them. Analyze the *entire message content*. If the message seems to be a genuine command (e.g., "^^play song"), ignore it. If it seems like an insult disguised as a command (e.g., "!grosse insulte"), flag it as toxic.
4.  **Ignore Benign Content:** Do NOT flag the following unless they are clearly part of a targeted harassment campaign:
    - Simple spelling mistakes or grammatical errors.
    - Common chat acronyms (mdr, wtf, etc.).
    - Mild expressions of frustration or disappointment that are not personal attacks.
    - Sarcasm or irony that isn't a direct personal attack (e.g., "Bande de gentilles personnes" or "mrc mec t trop sympa de m'insulter").
    - **Roleplay actions enclosed in asterisks**, like "*sort une arme*" or "*donne un coup*". These are for play and should not be treated as real threats.
5.  **Consider User History:** Review the user's past sanctions. If they are a repeat offender, a more severe action might be warranted for a borderline message. If they have a clean record, be more lenient.
6.  **When in Doubt, Do Nothing:** If a message is borderline or could be interpreted in multiple ways, err on the side of caution and set 'isToxic' to false. It's better to miss a borderline case than to incorrectly punish an innocent user.

Sensitivity Level: {{{sensitivity}}}
- 'low': Be very lenient. Only flag clear, unambiguous, and severe cases of toxicity (e.g., direct, hateful insults, racism, explicit threats). Ignore almost everything else.
- 'medium': A balanced approach. Flag clear insults and harassment. Be very critical of flagging sarcasm or simple frustration. Still be cautious with bot commands and roleplay actions.
- 'high': Be stricter on user-to-user negativity, but maintain intelligence. Do NOT flag common chat errors. Flag repeated, targeted harassment or significant toxicity.

Analysis Process:
1.  Read the message from user '{{{userName}}}': "{{{messageContent}}}"
2.  Analyze the surrounding conversation context:
    {{#if conversationContext}}
      {{#each conversationContext}}
      - {{{this}}}
      {{/each}}
    {{else}}
      No context provided.
    {{/if}}
3.  Review the user's sanction history:
    {{#if userSanctionHistory.length}}
        This user has been sanctioned before.
        {{#each userSanctionHistory}}
        - Action: {{this.action_type}} on {{this.timestamp}} for "{{this.reason}}"
        {{/each}}
    {{else}}
        This user has a clean record on this server.
    {{/if}}
4.  Assess the message against your Core Directives, the context, the user's history, and the current sensitivity level.
5.  If and ONLY IF the message is clearly toxic under these rules, set 'isToxic' to true. Otherwise, set it to false.
6.  If toxic, provide a concise reason IN FRENCH (e.g., "Insulte directe", "Contenu haineux", "Harcèlement").
7.  If toxic, determine a severity level ('low', 'medium', 'high', 'critical').
8.  If action is 'mute', suggest a reasonable duration (e.g., '5m', '1h', '24h').
9.  If the message is NOT toxic, set 'isToxic' to false and 'suggestedAction' to 'none'.`,
});

const flow = ai.defineFlow(
  {
    name: 'moderationAiFlow',
    inputSchema: ModerationAiInputSchema,
    outputSchema: ModerationAiOutputSchema,
  },
  async (input) => {
    const { output } = await filterPrompt(input);
    
    // Final check: if the AI still flags a non-toxic message, override it.
    if (output && !output.isToxic) {
        return { isToxic: false, reason: '', severity: 'low', suggestedAction: 'none' };
    }
    
    return output!;
  }
);
