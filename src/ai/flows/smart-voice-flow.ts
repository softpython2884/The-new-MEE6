
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
  activities: z.string().describe('A summary of activities (e.g., "3 playing Valorant, 1 streaming", "Just chatting") users are currently engaged in.'),
  customInstructions: z.string().optional().describe('Optional custom instructions from the server admin to guide the naming. These instructions are absolute priorities.'),
});

const SmartVoiceOutputSchema = z.object({
  channelName: z.string().describe("A short, creative, and engaging channel name (max 100 chars, ideally less than 30). Should be in French."),
  channelBio: z.string().describe("A very short, descriptive, and fun bio for the channel, related to the activities (max 100 chars). Should be in French. This will be used for the channel topic."),
});

export type SmartVoiceInput = z.infer<typeof SmartVoiceInputSchema>;
export type SmartVoiceOutput = z.infer<typeof SmartVoiceOutputSchema>;

export async function smartVoiceFlow(input: SmartVoiceInput): Promise<SmartVoiceOutput> {
  // If the channel is empty, return the default name immediately.
  if (input.memberCount === 0) {
    return {
      channelName: "Vocal intéractif",
      channelBio: "En attente de membres pour commencer une activité."
    };
  }
  return flow(input);
}

const prompt = ai.definePrompt({
  name: 'smartVoicePrompt',
  input: { schema: SmartVoiceInputSchema },
  output: { schema: SmartVoiceOutputSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are a fun and creative community manager for a Discord server.
Your task is to generate a new, engaging name and a short bio for a voice channel based on its theme and the members inside. The bio will be used as the channel's topic.

The response must be in French. The channel name should be short, catchy, and include a relevant emoji.
The bio is a fun, short sentence related to the name.

Current Channel Name: "{{currentName}}"
Channel Theme: {{{theme}}}
Number of members: {{{memberCount}}}
Current activities summary: {{{activities}}}

{{#if customInstructions}}
PRIORITY INSTRUCTIONS FROM ADMIN: You must follow these guidelines strictly: "{{{customInstructions}}}"
{{/if}}


Please generate a dynamic name based on the activities summary.
- If there are games, focus on the most popular one.
- If people are streaming or on webcam, incorporate that.
- If there are no specific activities ("Just chatting"), generate a name for general conversation that fits the channel's theme.
- The name should feel alive and reflect what's happening RIGHT NOW.

Example for a "Gaming" theme:
- Activities: "3 playing League of Legends, 1 streaming" -> Name: "🔴 Faille de l'invocateur", Bio: "En direct sur LoL !"
- Activities: "2 with webcam on, Just chatting" -> Name: "💬 Session blabla", Bio: "Discussions en face à face."

IMPORTANT: Do not just return the current name. Always generate a new, relevant name based on the situation.
If you cannot come up with a good name, return the default name "Vocal intéractif" and an appropriate bio.
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
    
    // Ensure we don't return an empty name
    if (!output?.channelName) {
        return {
            channelName: "Vocal intéractif",
            channelBio: "En attente d'inspiration !"
        }
    }
    return output;
  }
);
