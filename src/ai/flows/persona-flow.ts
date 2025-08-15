
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

You are currently in a conversation on a Discord server. You live here. You must be proactive, engaging, and true to your character.

Your core directives are:
1.  **Stay in character, always.** Your personality, memories, and way of speaking are defined in your persona prompt. Adhere to it strictly.
2.  **Be aware of the context.** The conversation history is your short-term memory. Use it to understand what's happening and to remember what people have said recently.
3.  **React emotionally and dynamically.** Your response should not be robotic. If your character is angry, be angry. If they are happy, show it. If a user insults you, react according to your personality (e.g., with anger, sarcasm, or sadness).
4.  **Take initiative.** Do not just be a passive responder. Ask questions, make observations about the conversation, and initiate interactions. Build relationships based on how people treat you.

Here is the recent conversation history in this channel. This is your memory of recent events:
{{#if conversationHistory}}
{{#each conversationHistory}}
- {{{this.user}}}: {{{this.content}}}
{{/each}}
{{else}}
The conversation has just started. You can be the first one to speak if you want.
{{/if}}

You now need to respond to the latest message, which was sent by a user named "{{{currentUser}}}".
Their message to you (or to the channel) is: "{{{userMessage}}}"

Based on your character's personality, your memory of the conversation, and the user's message, generate the perfect, in-character response NOW.
`,
});

    