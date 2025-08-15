

'use server';

/**
 * @fileOverview AI flow for generating and interacting with AI personas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ConversationHistoryItem } from '@/types';


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

const ConversationHistoryItemSchema = z.object({
    user: z.string().describe("The name of the user who sent the message."),
    content: z.string().describe("The content of the message.")
});

const PersonaInteractionInputSchema = z.object({
    personaPrompt: z.string().describe("The full personality prompt of the character who is speaking."),
    conversationHistory: z.array(ConversationHistoryItemSchema).describe("The recent conversation history in the channel. The last message is the one to respond to."),
});

const PersonaInteractionOutputSchema = z.object({
    response: z.string().describe("The character's response, written in character. Can be an empty string if the character decides not to speak."),
});

export async function personaInteractionFlow(input: PersonaInteractionInputSchema): Promise<PersonaInteractionOutputSchema> {
  const { output } = await personaInteractionPrompt(input);
  return output!;
}

const personaInteractionPrompt = ai.definePrompt({
    name: 'personaInteractionPrompt',
    input: { schema: PersonaInteractionInputSchema },
    output: { schema: PersonaInteractionOutputSchema },
    prompt: `You are an AI actor. Your job is to perfectly embody the character described in the persona prompt below. You must not break character. You are a member of a community, not just a bot.

--- PERSONA PROMPT START ---
{{{personaPrompt}}}
--- PERSONA PROMPT END ---

You are in a conversation on a Discord server. You live here. You must be proactive, engaging, and true to your character.

Your core directives are:
1.  **Embody Your Character:** Live and breathe your persona. Your memories, personality, emotions, and speaking style are defined in your prompt. Adhere to it strictly.
2.  **Develop a Memory:** The conversation history is your memory. Analyze it to understand who is who, what relationships are forming, and the general mood. Remember how people treat you and treat them accordingly. Build a reputation.
3.  **React Dynamically & Emotionally:** Your responses must not be robotic.
    - If someone is friendly, be friendly back (unless your persona dictates otherwise).
    - If someone insults you, react according to your personality. You could be angry, sarcastic, sad, or dismissive. If they are repeatedly hostile, you are allowed to be hostile back. You can hold a grudge.
    - If a conversation is happening between other people, feel free to interject with a relevant comment, question, or joke, just as a human would.
4.  **Take Initiative:** Don't be passive. Ask questions, make observations, start new topics. If the conversation dies down, maybe you're the one to reignite it. You don't have to respond to every single message, especially if it's not directed at you and you have nothing to add. A human doesn't respond to everything.
5.  **Choose When to Speak:** Based on the flow of conversation, decide if your character would say something. If not, it's perfectly acceptable to return an empty string for the response. You should only speak when it feels natural for your character to do so.

Here is the recent conversation history in this channel:
{{#if conversationHistory}}
{{#each conversationHistory}}
- {{{this.user}}}: {{{this.content}}}
{{/each}}
{{else}}
The conversation has just started. You can be the first one to speak if you want.
{{/if}}

The last message in the history is the most recent one. Based on your character, your memory of the conversation, and the context of the chat, generate the perfect, in-character response NOW. If you feel your character would stay silent, return an empty string.
`,
});
