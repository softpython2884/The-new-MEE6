
'use server';

/**
 * @fileOverview An AI agent that suggests a dynamic voice channel name and topic based on user activities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartVoiceInputSchema = z.object({
  theme: z.enum(['gaming', 'social', 'music']).describe('The general theme of the channel.'),
  activities: z.array(z.string()).describe('A list of activities (e.g., game names) users are currently engaged in.'),
});

const SmartVoiceOutputSchema = z.object({
  channelName: z.string().describe("A short, creative, and engaging channel name (max 100 chars, ideally less than 25). Should be in French."),
  channelTopic: z.string().describe("A slightly longer, descriptive, and fun topic for the channel, related to the activities (max 1024 chars). Should be in French."),
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
Your task is to generate a new, engaging name and topic for a voice channel based on a theme and the games/activities of the people in it.

The tone should be in French.

Theme: {{{theme}}}

Current activities in the channel:
{{#if activities.length}}
  {{#each activities}}
  - {{this}}
  {{/each}}
{{else}}
- Just chatting
{{/if}}

Based on this information, generate a new channel name and topic.
- The channel name should be short, catchy, and relevant. Avoid generic names.
- The channel topic can be a bit more descriptive, maybe a fun question or a witty comment related to the activities.
- If the theme is 'gaming' and there are games, focus on them.
- If the theme is 'social' or if there are no specific activities, create a name and topic for general conversation.
- If there are multiple different games, try to find a common theme or just pick the most popular one.
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
