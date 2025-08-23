
'use server';

/**
 * @fileOverview An AI flow for reformatting user announcements into clean embeds.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnnouncementInputSchema = z.object({
  rawText: z.string().describe("The user's raw, unformatted announcement text."),
  authorName: z.string().describe("The name of the person making the announcement."),
});

const AnnouncementOutputSchema = z.object({
  title: z.string().describe("A short, catchy, and relevant title for the announcement."),
  description: z.string().describe("The well-formatted and rewritten announcement text, ready for a Discord embed. Use Discord markdown like **bold** and *italics*."),
});

export async function announcementFlow(input: z.infer<typeof AnnouncementInputSchema>): Promise<z.infer<typeof AnnouncementOutputSchema>> {
  const { output } = await announcementPrompt(input);
  return output!;
}


const announcementPrompt = ai.definePrompt({
    name: 'announcementPrompt',
    input: { schema: AnnouncementInputSchema },
    output: { schema: AnnouncementOutputSchema },
    model: 'googleai/gemini-2.0-flash',
    prompt: `You are an expert community manager and copywriter for Discord.
Your task is to take a raw announcement text from an administrator and transform it into a clean, professional, and engaging announcement embed.

You must:
1.  Read the raw text to understand the core message.
2.  Create a short, impactful title that summarizes the announcement.
3.  Rewrite the body of the announcement. Clean up any typos, improve the phrasing, and structure it for readability using Discord markdown (e.g., **bold** for important points, *italics* for emphasis, and lists with - or •).
4.  Ensure the tone is professional yet engaging for a community.

The announcement was written by: {{{authorName}}}
Raw announcement text:
"""
{{{rawText}}}
"""

Generate the title and description for the Discord embed now.
`,
});
