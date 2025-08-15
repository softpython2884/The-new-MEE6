
'use server';

/**
 * @fileOverview An AI agent that suggests a dynamic voice channel name and topic based on user activities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartVoiceInputSchema = z.object({
  currentName: z.string().describe('The current name of the voice channel.'),
  theme: z.enum(['gaming', 'social', 'music']).describe('The general theme of the channel.'),
  memberCount: z.number().describe('The number of members currently in the channel.'),
  activities: z.array(z.string()).describe('A list of activities (e.g., game names) users are currently engaged in.'),
  customInstructions: z.string().optional().describe('Optional custom instructions from the server admin to guide the naming.'),
});

const SmartVoiceOutputSchema = z.object({
  channelName: z.string().describe("A short, creative, and engaging channel name (max 100 chars, ideally less than 30). Should be in French."),
  channelBio: z.string().describe("A very short, descriptive, and fun bio for the channel, related to the activities (max 100 chars). Should be in French. This will be used for logging purposes."),
});

export type SmartVoiceInput = z.infer<typeof SmartVoiceInputSchema>;
export type SmartVoiceOutput = z.infer<typeof SmartVoiceOutputSchema>;

export async function smartVoiceFlow(input: SmartVoiceInput): Promise<SmartVoiceOutput> {
  return flow(input);
}

const prompt = ai.definePrompt({
  name: 'smartVoicePrompt',
  input: { schema: SmartVoiceInputSchema },
  output: { schema: SmartVoiceOutputSchema },
  prompt: `You are a fun and creative community manager for a Discord server.
Your task is to generate a new, engaging name and a short bio for a voice channel based on its theme and the members inside.

The response must be in French. The channel name should be short, catchy, and include a relevant emoji.

Current Channel Name: "{{currentName}}"
Theme: {{{theme}}}
Number of members: {{{memberCount}}}
Current activities in the channel:
{{#if activities.length}}
  {{#each activities}}
  - {{this}}
  {{/each}}
{{else}}
- Just chatting
{{/if}}

{{#if customInstructions}}
Special Instructions from the Admin: You must follow these guidelines: "{{{customInstructions}}}"
{{/if}}


Please generate a new channel name and a short bio based on one of the two scenarios:

Scenario 1: The channel is empty (memberCount is 0).
- Generate a default, welcoming name that encourages people to join, based on the channel's theme.
- Examples for 'gaming': "🎤 • En attente de joueurs", "🎮 • Choisissez un jeu".
- Examples for 'social': "☕ • Salon de discussion", "👋 • Envie de papoter ?".

Scenario 2: There are members in the channel (memberCount > 0).
- Generate a dynamic name based on the most popular activity. If activities are varied, find a common theme or be creative.
- If there are no specific activities, generate a name for general conversation.
- The name should feel alive and reflect what's happening RIGHT NOW.
- The bio should be a fun, short sentence related to the name.

IMPORTANT: Do not just return the current name. Always generate a new, relevant name based on the situation.
`,
});

const flow = ai.defineFlow(
  {
    name: 'smartVoiceFlow',
    inputSchema: SmartVoiceInputSchema,
    outputSchema: SmartVoiceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
