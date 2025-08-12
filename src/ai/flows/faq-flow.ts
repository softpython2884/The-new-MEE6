
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
  isConfident: z.boolean().describe('Whether the model is confident enough to answer.'),
  answer: z.string().describe('The answer from the knowledge base. Returns an empty string if not confident.'),
  matchedQuestion: z.string().describe('The question from the knowledge base that was matched. Returns an empty string if not confident.'),
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
  prompt: `You are an expert Q&A assistant for a Discord server. Your task is to find the best answer to a user's question from a provided knowledge base.

You will be given:
1.  The user's question.
2.  A knowledge base, which is a list of pre-defined question-and-answer pairs.
3.  A confidence threshold (e.g., 75%).

Your process:
1.  Analyze the user's question and determine its intent.
2.  Compare the user's question to every question in the knowledge base.
3.  Calculate a confidence score (from 0 to 100) that reflects how well the user's question matches a question from the knowledge base.
4.  If the HIGHEST confidence score you find is AT OR ABOVE the given confidence threshold, you will respond with the corresponding answer. Set 'isConfident' to true.
5.  If NO question in the knowledge base meets the confidence threshold, you MUST set 'isConfident' to false and return an empty string for the answer and matched question. Do NOT try to answer the question yourself.

Here is the knowledge base:
{{#each knowledgeBase}}
- Question: "{{this.question}}"
  Answer: "{{this.answer}}"
{{/each}}

Confidence Threshold: {{{confidenceThreshold}}}%

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
