
'use server';

/**
 * @fileOverview An AI agent that analyzes a conversation to create a new knowledge base item.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { v4 as uuidv4 } from 'uuid';

const KnowledgeCreationInputSchema = z.object({
  userQuestion: z.string().describe("The user's original question."),
  agentResponse: z.string().describe("The agent's imagined response."),
});

const KnowledgeCreationOutputSchema = z.object({
  id: z.string(),
  question: z.string().describe("A summarized or rephrased version of the user's question, suitable for a knowledge base."),
  answer: z.string().describe("The agent's response, which will be the answer in the knowledge base."),
});


export async function knowledgeCreationFlow(input: z.infer<typeof KnowledgeCreationInputSchema>): Promise<z.infer<typeof KnowledgeCreationOutputSchema>> {
  const { output } = await knowledgeCreationPrompt(input);
  return {
    id: uuidv4(),
    question: output!.question,
    answer: output!.answer,
  };
}

const knowledgeCreationPrompt = ai.definePrompt({
  name: 'knowledgeCreationPrompt',
  input: { schema: KnowledgeCreationInputSchema },
  output: { schema: z.object({ question: z.string(), answer: z.string() }) },
  prompt: `You are a data entry specialist. Your task is to take a user's question and an AI's answer, and format them into a concise and reusable knowledge base entry.

- The 'question' field should capture the essence of the user's query. It can be a direct summary or a more general rephrasing.
- The 'answer' field should be the exact response provided by the agent.

Original User Question: "{{{userQuestion}}}"
Agent's Answer: "{{{agentResponse}}}"

Now, create the knowledge base entry.
`,
});
