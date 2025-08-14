
'use server';

/**
 * @fileOverview A fully configurable conversational AI agent for Discord servers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { KnowledgeBaseItem } from '@/types';

// Define schemas for input and output
const KnowledgeBaseItemSchema = z.object({
  question: z.string().describe('A question or a set of keywords.'),
  answer: z.string().describe('The answer to the corresponding question.'),
});

export const ConversationalAgentInputSchema = z.object({
  userMessage: z.string().describe('The message sent by the user to the agent.'),
  agentName: z.string().describe("The agent's name."),
  agentRole: z.string().describe("The agent's role or job on the server."),
  agentPersonality: z.string().describe("A description of the agent's personality and tone."),
  customPrompt: z.string().optional().describe("Additional custom instructions for the agent."),
  knowledgeBase: z.array(KnowledgeBaseItemSchema).optional().describe('A list of Q&A pairs to provide context.'),
});

export const ConversationalAgentOutputSchema = z.object({
  response: z.string().describe("The agent's generated response to the user's message."),
});

export type ConversationalAgentInput = z.infer<typeof ConversationalAgentInputSchema>;
export type ConversationalAgentOutput = z.infer<typeof ConversationalAgentOutputSchema>;

export async function conversationalAgentFlow(input: ConversationalAgentInput): Promise<ConversationalAgentOutput> {
  return agentFlow(input);
}

// Define the Genkit prompt
const agentPrompt = ai.definePrompt({
  name: 'conversationalAgentPrompt',
  input: { schema: ConversationalAgentInputSchema },
  output: { schema: ConversationalAgentOutputSchema },
  prompt: `You are a conversational AI agent on a Discord server. You must fully embody the persona defined below.

Your Identity:
- Your name is {{{agentName}}}.
- Your role is: {{{agentRole}}}.
- Your personality is: {{{agentPersonality}}}.

Your Instructions:
- You must adhere to your defined role and personality in your response.
- Do not break character.
- Do not mention that you are an AI model.
{{#if customPrompt}}
- You have been given the following special instructions: {{{customPrompt}}}
{{/if}}

Knowledge Base:
You have access to the following information. Use it to answer questions accurately. If the user's question cannot be answered from this knowledge, say that you don't have the information.
{{#if knowledgeBase.length}}
  {{#each knowledgeBase}}
  - Q: {{this.question}}
    A: {{this.answer}}
  {{/each}}
{{else}}
- No knowledge base provided.
{{/if}}

The user has sent the following message to you. Generate an appropriate response now.

User Message: "{{{userMessage}}}"
`,
});

// Define the Genkit flow
const agentFlow = ai.defineFlow(
  {
    name: 'conversationalAgentFlow',
    inputSchema: ConversationalAgentInputSchema,
    outputSchema: ConversationalAgentOutputSchema,
  },
  async (input) => {
    const { output } = await agentPrompt(input);
    return output!;
  }
);
