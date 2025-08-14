
'use server';
/**
 * @fileOverview An AI agent that generates and modifies Discord server structures.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getServerStructure } from '../tools/discord-structure-tool';

const ServerBuilderInputSchema = z.object({
  guildId: z.string().describe("The ID of the Discord server."),
  request: z.string().describe("The user's request, e.g., a theme for creation or modification instructions."),
  mode: z.enum(['create', 'edit', 'delete', 'reset']).describe("The operation mode for the builder.")
});

const RoleSchema = z.object({
  name: z.string(),
  color: z.string().optional(),
  hoist: z.boolean().optional(),
  mentionable: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

const OverwriteSchema = z.object({
  target: z.string(),
  permissions: z.record(z.boolean()),
});

const CategorySchema = z.object({
  name: z.string(),
  overwrites: z.array(OverwriteSchema).optional(),
});

const ChannelSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'voice']),
  category: z.string().optional(),
  topic: z.string().optional(),
  nsfw: z.boolean().optional(),
  slowmode_delay: z.number().optional(),
  overwrites: z.array(OverwriteSchema).optional(),
});

const ServerBuilderOutputSchema = z.object({
  roles: z.array(RoleSchema),
  categories: z.array(CategorySchema),
  channels: z.array(ChannelSchema),
});


export type ServerBuilderInput = z.infer<typeof ServerBuilderInputSchema>;
export type ServerBuilderOutput = z.infer<typeof ServerBuilderOutputSchema>;


const serverBuilderPrompt = ai.definePrompt({
  name: 'serverBuilderPrompt',
  input: { schema: ServerBuilderInputSchema },
  output: { schema: ServerBuilderOutputSchema },
  tools: [getServerStructure],
  prompt: `You are an expert Discord community architect. Your task is to generate or modify a complete Discord server structure based on a user's request.
The final output must be a parsable JSON object conforming to the output schema.

User Request: "{{request}}"
Mode: {{mode}}

1.  First, call the 'getServerStructure' tool with the provided 'guildId' to get the current server layout.
2.  Analyze the user's request and the current structure.
3.  Generate a *new, complete* server structure JSON object that incorporates the user's request.
    -   If mode is 'create' or 'reset', generate a full structure based on the theme in the request, ignoring the existing structure.
    -   If mode is 'edit' or 'delete', modify the existing structure. Preserve existing elements unless the user asks to change or remove them.
    -   Ensure roles are created before categories, and categories before channels.
    -   Use relevant emojis in channel names.
    -   Be meticulous with permissions for roles and channels.
`,
});

export const serverBuilderFlow = ai.defineFlow(
  {
    name: 'serverBuilderFlow',
    inputSchema: ServerBuilderInputSchema,
    outputSchema: ServerBuilderOutputSchema,
  },
  async (input) => {
    const { output } = await serverBuilderPrompt(input);
    if (!output) {
      throw new Error('Failed to generate server structure.');
    }
    return output;
  }
);
