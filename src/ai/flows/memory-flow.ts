

'use server';

/**
 * @fileOverview An AI agent that analyzes conversation transcripts to create long-term memories for a persona.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewMemorySchema = z.object({
  user_id: z.string().optional().describe("The user ID the memory is about. If the memory is about the persona itself (a self-reflection or a fact it stated about itself), this field should be omitted."),
  memory_type: z.enum(['fact', 'relationship', 'interaction_summary', 'preference']).describe("The type of memory."),
  content: z.string().describe("The content of the memory, written in the first person from the persona's perspective (e.g., 'I learned that Bob enjoys fishing.' or 'I told everyone that I dislike rainy days.')."),
  salience_score: z.number().min(1).max(10).describe("The importance of the memory on a scale of 1 to 10."),
});

const MemoryFlowInputSchema = z.object({
  persona_id: z.string(),
  conversationTranscript: z.string().describe("The full transcript of the recent conversation, including the persona's own messages."),
});

const MemoryFlowOutputSchema = z.array(
    // We can't directly return the full DB schema, so we create a compatible one
    z.object({
        persona_id: z.string(),
        user_id: z.string().optional(),
        memory_type: z.enum(['fact', 'relationship', 'interaction_summary', 'preference']),
        content: z.string(),
        salience_score: z.number(),
    })
);

export async function memoryFlow(input: MemoryFlowInputSchema): Promise<z.infer<typeof MemoryFlowOutputSchema>> {
    const { output } = await memoryCreationPrompt(input);
    
    if (!output) {
        return [];
    }

    // Add persona_id to each memory object
    return output.map(mem => ({
        ...mem,
        persona_id: input.persona_id
    }));
}


const memoryCreationPrompt = ai.definePrompt({
    name: 'memoryCreationPrompt',
    input: { schema: MemoryFlowInputSchema },
    // The AI will output an array of new memories to be created.
    output: { schema: z.array(NewMemorySchema) },
    prompt: `You are the reflective part of an AI's consciousness.
Your task is to analyze a recent conversation transcript and decide what is important to remember for the long term. The transcript includes the persona's own messages.

You must extract key information and convert it into memories. You can create two types of memories:
1.  **Memories about OTHERS:** What did you learn about another user? (e.g., "John's favorite color is blue.") For these, you must include the user's ID.
2.  **Memories about YOURSELF:** What new fact, opinion, or piece of backstory did you (the persona) reveal about yourself? (e.g., "I mentioned that I grew up in a small town," or "I decided I have a fear of spiders."). For these, you must OMIT the user_id. This is crucial for building a consistent self-identity.

For each potential memory, you must:
1.  Determine its type ('fact', 'preference', 'interaction_summary', 'relationship').
2.  Write the memory's content from a first-person perspective.
3.  Assign a salience score (1-10) based on its importance. A casual preference might be a 3, while a major argument might be a 9.
4.  If the memory is about a specific user, include their user ID. If it's about yourself, do not include a user ID.

Only create memories for significant information. Do not create memories for trivial small talk.
If nothing noteworthy happened, you can return an empty array.

Analyze the following conversation transcript now and create new memories.

--- CONVERSATION TRANSCRIPT ---
{{{conversationTranscript}}}
--- END OF TRANSCRIPT ---
`,
});
