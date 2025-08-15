
'use server';

/**
 * @fileOverview An AI agent that suggests a dynamic voice channel name and topic based on user activities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartVoiceInputSchema = z.object({
  currentName: z.string().describe('The current name of the voice channel.'),
  theme: z.string().describe('The general theme of the channel, provided by the user (e.g., "Gaming", "Soirée Film", "QG des développeurs").'),
  memberCount: z.number().describe('The number of members currently in the channel.'),
  activities: z.array(z.string()).describe('A list of activities (e.g., game names) users are currently engaged in.'),
  customInstructions: z.string().optional().describe('Optional custom instructions from the server admin to guide the naming. These instructions are absolute priorities.'),
});

const SmartVoiceOutputSchema = z.object({
  channelName: z.string().describe("A short, creative, and engaging channel name (max 100 chars, ideally less than 30). Should be in French."),
  channelBio: z.string().describe("A very short, descriptive, and fun bio for the channel, related to the activities (max 100 chars). Should be in French. This will be used for logging and to help the AI conceptualize the name."),
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
The bio is a conceptual tool to help you create a better name; it should be a fun, short sentence related to the name.

Current Channel Name: "{{currentName}}"
Channel Theme: {{{theme}}}
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
PRIORITY INSTRUCTIONS FROM ADMIN: You must follow these guidelines strictly: "{{{customInstructions}}}"
{{/if}}


Please generate a new channel name and a short bio based on one of the two scenarios below, always respecting the admin's custom instructions if provided.

Scenario 1: The channel is empty (memberCount is 0).
- Generate a default, welcoming name that encourages people to join, based on the channel's custom theme.
- For a "Gaming" theme: "🎤 • En attente de joueurs", "🎮 • Choisissez un jeu".
- For a "Social" theme: "☕ • Salon de discussion", "👋 • Envie de papoter ?".
- For a custom theme like "Soirée Cinéma", you could suggest: "🎬 • Préparez le popcorn !".

Scenario 2: There are members in the channel (memberCount > 0).
- Generate a dynamic name based on the most popular activity. If activities are varied, find a common theme or be creative.
- If there are no specific activities, generate a name for general conversation that fits the channel's theme.
- The name should feel alive and reflect what's happening RIGHT NOW.

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
