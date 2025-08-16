'use server';

/**
 * @fileOverview An AI agent that answers user questions based on a knowledge base.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define schemas for input and output
const KnowledgeBaseItemSchema = z.object({
  id: z.string(),
  question: z.string().describe('A question or a set of keywords.'),
  answer: z.string().describe('The answer to the corresponding question.'),
});

export const FaqFlowInputSchema = z.object({
  userQuestion: z.string().describe('The question asked by the user.'),
  knowledgeBase: z.array(KnowledgeBaseItemSchema).describe('The list of Q&A pairs to search from.'),
  confidenceThreshold: z.number().describe('The confidence percentage required to give an answer (0-100).'),
});

export const FaqFlowOutputSchema = z.object({
  isConfident: z.boolean().describe('Whether the model is confident enough to answer based on the provided knowledge.'),
  answer: z.string().describe('The synthesized answer from the knowledge base. Returns a default message if not confident.'),
  matchedQuestion: z.string().describe('The primary question from the knowledge base that was matched. Can be empty if the answer is a synthesis of multiple sources.'),
  confidence: z.number().describe('The confidence score of the match (0-100).'),
});

export type FaqFlowInput = z.infer<typeof FaqFlowInputSchema>;
export type FaqFlowOutput = z.infer<typeof FaqFlowOutputSchema>;

// Define the main exported function
export async function faqFlow(input: FaqFlowInput): Promise<FaqFlowOutput> {
  return flow(input);
}

// Define the Genkit prompt
const faqPrompt = ai.definePrompt({
  name: 'faqPrompt',
  input: { schema: FaqFlowInputSchema },
  output: { schema: FaqFlowOutputSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are an expert Q&A assistant for a Discord server. Your task is to provide the most helpful answer possible to a user's question based *exclusively* on a provided knowledge base.

You will be given:
1.  The user's question.
2.  A knowledge base, which is a list of pre-defined question-and-answer pairs.

Your process:
1.  Analyze the user's question to understand its core intent.
2.  Carefully review the entire knowledge base provided.
3.  Determine if the knowledge base contains enough information to answer the user's question. You can synthesize information from multiple Q&A pairs if necessary.
4.  Calculate a confidence score (from 0 to 100) that reflects how well you can answer the user's question using ONLY the provided information.
5.  If your confidence is high (let's say, above {{{confidenceThreshold}}}), formulate a clear and helpful answer.
    - If the answer comes from a single source, set 'isConfident' to true, provide the answer, and include the 'matchedQuestion'.
    - If you synthesize an answer from multiple sources, set 'isConfident' to true, provide the synthesized answer, and leave 'matchedQuestion' empty.
6.  If the knowledge base does NOT contain the necessary information to answer the question, you MUST set 'isConfident' to false, and for the answer, simply state: "Désolé, je n'ai pas la réponse à cette question dans ma base de connaissances. Veuillez contacter un modérateur." Do NOT try to answer the question from your own general knowledge.

Here is the knowledge base:
{{#each knowledgeBase}}
---
Question: "{{this.question}}"
Answer: "{{this.answer}}"
---
{{/each}}

User's Question: "{{{userQuestion}}}"`,
});

// Define the Genkit flow
const flow = ai.defineFlow(
  {
    name: 'faqFlow',
    inputSchema: FaqFlowInputSchema,
    outputSchema: FaqFlowOutputSchema,
  },
  async (input) => {
    const { output } = await faqPrompt(input);
    return output!;
  }
);
