
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

const ConversationHistoryItemSchema = z.object({
    user: z.string().describe("The display name (nickname) of the user who sent the message."),
    content: z.string().describe("The content of the message.")
});

export const ConversationalAgentInputSchema = z.object({
  userMessage: z.string().describe('The message sent by the user to the agent.'),
  userName: z.string().describe("The user's display name (nickname)."),
  agentName: z.string().describe("The agent's name."),
  agentRole: z.string().describe("The agent's role or job on the server."),
  agentPersonality: z.string().describe("A description of the agent's personality and tone."),
  customPrompt: z.string().optional().describe("Additional custom instructions for the agent."),
  knowledgeBase: z.array(KnowledgeBaseItemSchema).optional().describe('A list of Q&A pairs to provide context.'),
  conversationHistory: z.array(ConversationHistoryItemSchema).optional().describe('The last few messages in the conversation for context.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "An optional photo sent by the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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
- You are speaking to a user named {{{userName}}}. Address them by their nickname when it feels natural.
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

Conversation History:
{{#if conversationHistory}}
Here are the last few messages in this conversation. Use them to understand the context.
{{#each conversationHistory}}
- {{{this.user}}}: {{{this.content}}}
{{/each}}
{{/if}}


The user has sent the following message to you.
{{#if photoDataUri}}
The user has also included an image in their message. Analyze the image as part of the context.
Image: {{media url=photoDataUri}}
{{/if}}

Generate an appropriate response now.

User Message from {{{userName}}}: "{{{userMessage}}}"
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
