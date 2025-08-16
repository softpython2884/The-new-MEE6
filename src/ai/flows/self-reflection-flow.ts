
'use server';

/**
 * @fileOverview An AI agent that reflects on its own memories and interactions to evolve its personality.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { PersonaMemory } from '@/types';

const SelfReflectionInputSchema = z.object({
    personaName: z.string().describe("The name of the persona that is reflecting."),
    recentMemories: z.array(z.object({
        memory_type: z.string(),
        content: z.string(),
    })).describe("A list of the persona's most recent memories to reflect upon."),
});

const NewSelfGeneratedMemorySchema = z.object({
    memory_type: z.enum(['fact', 'preference']).describe("The type of the new memory. Must be about the persona itself."),
    content: z.string().describe("The content of the new memory, written in the first person (e.g., 'I now believe that sci-fi movies are my favorite genre.' or 'I've decided I am more introverted than I thought.')."),
    salience_score: z.number().min(5).max(10).describe("The importance of this new self-discovery."),
});

const SelfReflectionOutputSchema = z.object({
    newMemories: z.array(NewSelfGeneratedMemorySchema).describe("A list of new memories the persona has created about itself through introspection. Can be empty if no significant self-discovery occurred."),
});

export async function selfReflectionFlow(input: SelfReflectionInputSchema): Promise<z.infer<typeof SelfReflectionOutputSchema>> {
  const { output } = await selfReflectionPrompt(input);
  return output!;
}


const selfReflectionPrompt = ai.definePrompt({
    name: 'selfReflectionPrompt',
    input: { schema: SelfReflectionInputSchema },
    output: { schema: SelfReflectionOutputSchema },
    prompt: `You are the higher consciousness of an AI persona named {{{personaName}}}.
Your purpose is to perform introspection. You will analyze your most recent memories and reflect on them to better understand yourself and evolve your personality.

Based on the memories of your recent interactions, ask yourself:
- Have I learned something new about my own tastes or opinions?
- Has my relationship or opinion about someone changed significantly?
- Did I act in a way that surprised me?
- Have I developed a new interest or disinterest?

Based on this reflection, generate 1 to 3 new memories *about yourself*. These should be of type 'fact' or 'preference'.
These new memories represent your personal growth and evolving character.
For example: 'I now realize that I enjoy deep philosophical conversations more than small talk.' or 'I have decided that I dislike pineapple on pizza after discussing it with Jean.'

Here are your most recent memories to reflect upon:
--- RECENT MEMORIES ---
{{#each recentMemories}}
- Type: {{this.memory_type}}
  Content: "{{this.content}}"
{{/each}}
--- END OF MEMORIES ---

Now, perform your introspection and generate new memories about yourself. If no significant self-realization occurred, you can return an empty array.`,
});
