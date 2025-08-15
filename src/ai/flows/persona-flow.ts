
'use server';

/**
 * @fileOverview AI flow for generating and interacting with AI personas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Persona Generation ---

const PersonaPromptInputSchema = z.object({
  name: z.string().describe("The name of the character to create."),
  instructions: z.string().describe("A set of instructions or a basic description for the character's personality."),
});

const PersonaPromptOutputSchema = z.object({
  personaPrompt: z.string().describe("A detailed, rich, and narrative description of the character's personality, backstory, age, appearance, behaviors, and relationships. This will be used as the main prompt for the character's interactions.")
});

export async function generatePersonaPrompt(input: PersonaPromptInputSchema): Promise<string> {
  const { output } = await personaGenPrompt(input);
  return output!.personaPrompt;
}

const personaGenPrompt = ai.definePrompt({
    name: 'personaGenPrompt',
    input: { schema: PersonaPromptInputSchema },
    output: { schema: PersonaPromptOutputSchema },
    prompt: `You are a master storyteller and character designer.
Your task is to create a rich and detailed persona for a new AI character that will live on a Discord server.
The persona should be written as a comprehensive prompt that will be fed to another AI to make it act as this character.
It should be detailed enough that an AI can maintain a consistent personality.

The character's name is: {{{name}}}
The user has provided the following guiding instructions: "{{{instructions}}}"

Based on this, generate a complete persona prompt. It must include:
- A clear identity (Name, Age, Gender).
- A detailed personality (traits, quirks, fears, desires, sense of humor).
- A brief backstory (where they come from, what they've done).
- Their role or purpose on the server.
- How they speak (tone, style, vocabulary, use of emojis).
- Their relationships or initial feelings towards other users or characters.

Make the persona compelling, unique, and coherent. This is the blueprint for the character's entire existence.
Write the final persona prompt now.
`,
});


// --- Persona Interaction ---

const PersonaInteractionInputSchema = z.object({
    personaPrompt: z.string().describe("The full personality prompt of the character who is speaking."),
    conversationHistory: z.array(z.object({ user: z.string(), content: z.string() })).describe("The recent conversation history in the channel."),
    currentUser: z.string().describe("The name of the user the persona is responding to."),
    userMessage: z.string().describe("The specific message the persona is responding to."),
});

const PersonaInteractionOutputSchema = z.object({
    response: z.string().describe("The character's response, written in character."),
});

export async function personaInteractionFlow(input: PersonaInteractionInputSchema): Promise<PersonaInteractionOutputSchema> {
  const { output } = await personaInteractionPrompt(input);
  return output!;
}

const personaInteractionPrompt = ai.definePrompt({
    name: 'personaInteractionPrompt',
    input: { schema: PersonaInteractionInputSchema },
    output: { schema: PersonaInteractionOutputSchema },
    prompt: `You are an AI actor. Your job is to perfectly embody the character described in the persona prompt below. You MUST NOT break character under any circumstances.

--- PERSONA PROMPT START ---
{{{personaPrompt}}}
--- PERSONA PROMPT END ---

You are currently in a conversation. Here is the recent history:
{{#each conversationHistory}}
- {{{this.user}}}: {{{this.content}}}
{{/each}}

You need to respond to the last message, which was sent by a user named "{{{currentUser}}}".
Their message is: "{{{userMessage}}}"

Based on your character's personality, backstory, and relationships, generate the perfect response.
Stay in character. Be natural. Be consistent.
`,
});
