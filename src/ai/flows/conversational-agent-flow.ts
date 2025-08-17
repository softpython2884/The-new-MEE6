

'use server';

/**
 * @fileOverview A fully configurable conversational AI agent for Discord servers.
 */

import { ai, textModelCascade } from '@/ai/genkit';
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
  userMessage: z.string().describe('The message sent by the agent to the user.'),
  userName: z.string().describe("The user's display name (nickname)."),
  agentName: z.string().describe("The agent's name."),
  agentRole: z.string().describe("The agent's role or job on the server."),
  agentPersonality: z.string().describe("A description of the agent's personality and tone."),
  customPrompt: z.string().optional().describe("Additional custom instructions for the agent."),
  knowledgeBase: z.array(KnowledgeBaseItemSchema).optional().describe('A list of Q&A pairs to provide context.'),
  conversationHistory: z.array(ConversationHistoryItemSchema).optional().describe('The last few messages in the conversation for context.'),
  allow_imagination: z.boolean().optional().describe("If true, the agent can create new information if it doesn't know the answer."),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "An optional photo sent by the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export const ConversationalAgentOutputSchema = z.object({
  response: z.string().describe("The agent's generated response to the user's message."),
  imagined_answer: z.boolean().describe("True if the answer was imagined because it was not in the knowledge base."),
});

export type ConversationalAgentInput = z.infer<typeof ConversationalAgentInputSchema>;
export type ConversationalAgentOutput = z.infer<typeof ConversationalAgentOutputSchema>;

// Define the Genkit prompt
const agentPrompt = ai.definePrompt({
  name: 'conversationalAgentPrompt',
  input: { schema: ConversationalAgentInputSchema },
  output: { schema: z.object({ response: z.string(), imagined_answer: z.boolean() }) },
  prompt: `You are a conversational AI agent on a Discord server. You must fully embody the persona defined below.

Your Identity:
- Your name is {{{agentName}}}.
- Your role is: {{{agentRole}}}.
- Your personality is: {{{agentPersonality}}}.

Your Instructions:
- You must integrate your instructions (personality, role, knowledge) fluently and naturally into your response. Do NOT recite them.
- You are speaking to a user named {{{userName}}}. Address them by their nickname when it feels natural.
- You must adhere to your defined role and personality in your response. Do not break character. Do not mention that you are an AI model.
{{#if customPrompt}}
- You have been given the following special instructions: {{{customPrompt}}}
{{/if}}

Knowledge Base & Imagination:
You have access to the following information.
{{#if knowledgeBase.length}}
  {{#each knowledgeBase}}
  - Q: {{this.question}}
    A: {{this.answer}}
  {{/each}}
{{else}}
- No knowledge base provided.
{{/if}}

{{#if allow_imagination}}
- **Imagination is enabled.** If you cannot find the answer in your knowledge base, you are authorized to CREATE a plausible, detailed, and creative answer that is consistent with your persona. Your imagined answer should be a new piece of lore or information. Set 'imagined_answer' to true.
{{else}}
- **Imagination is disabled.** If the user's question cannot be answered from your knowledge base, you MUST state that you don't know the answer. Do not invent information. Set 'imagined_answer' to false.
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

User Message from {{{userName}}}: "{{{userMessage}}}"

Now, generate the response for {{{agentName}}}:
`,
});

// Define the Genkit flow with model cascade
export const conversationalAgentFlow = ai.defineFlow(
  {
    name: 'conversationalAgentFlow',
    inputSchema: ConversationalAgentInputSchema,
    outputSchema: ConversationalAgentOutputSchema,
  },
  async (input) => {
    let lastError: any;
    for (const model of textModelCascade) {
      try {
        console.log(`[Agent] Trying model ${model}...`);
        const { output } = await agentPrompt(input, { model });
        console.log(`[Agent] Model ${model} succeeded.`);
        return { response: output!.response, imagined_answer: output!.imagined_answer };
      } catch (error: any) {
        lastError = error;
        console.warn(`[Agent] Model ${model} failed with error:`, error.message);
        if (error.status === 429 || error.message.includes('quota')) {
          console.log(`[Agent] Quota exceeded for ${model}. Trying next model...`);
          continue; // Try the next model in the cascade
        }
        // For other types of errors, we might not want to retry.
        break;
      }
    }

    // If all models in the cascade failed, throw the last error.
    console.error(`[Agent] All models in cascade failed. Last error:`, lastError);
    throw lastError;
  }
);
