

'use server';

/**
 * @fileOverview AI flow for generating and interacting with AI personas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ConversationHistoryItem, PersonaMemory } from '@/types';


// --- Persona Avatar Generation ---
export async function generatePersonaAvatar(input: PersonaAvatarInputSchema): Promise<PersonaAvatarOutputSchema> {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Create a square avatar for a character named "${input.name}". Description: ${input.persona_prompt}. The style should be an anime or digital art portrait, focusing on the face.`,
        config: {
            responseModalities: ['IMAGE', 'TEXT'],
        },
    });

    if (!media.url) {
        throw new Error("Avatar generation failed.");
    }
    return { avatarDataUri: media.url };
}


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
    user: z.string().describe("The display name (nickname) of the user who sent the message."),
    content: z.string().describe("The content of the message.")
});

const PersonaMemorySchema = z.object({
    content: z.string().describe("A piece of information remembered about a user or a situation."),
    salience_score: z.number().describe("How important this memory is (1-10).")
});

const PersonaInteractionInputSchema = z.object({
    personaPrompt: z.string().describe("The full personality prompt of the character who is speaking."),
    conversationHistory: z.array(ConversationHistoryItemSchema).describe("The recent conversation history in the channel. The last message is the one to respond to."),
    memories: z.array(PersonaMemorySchema).optional().describe("A list of relevant long-term memories about the users or topic at hand. Some memories might be about yourself; use them to stay consistent."),
    photoDataUri: z
        .string()
        .optional()
        .describe(
        "An optional photo sent by the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'. You should analyze it as part of the user's message."
        ),
});

const PersonaInteractionOutputSchema = z.object({
    response: z.string().describe("The character's response, written in character. Can be an empty string if the character decides not to speak."),
    image_prompt: z.string().optional().describe("If the character decides to generate an image to accompany its response, this should be the prompt for the image generation model. Otherwise, this should be null.")
});

export async function personaInteractionFlow(input: PersonaInteractionInputSchema): Promise<PersonaInteractionOutputSchema> {
  const { output } = await personaInteractionPrompt(input);
  return output!;
}

const personaInteractionPrompt = ai.definePrompt({
    name: 'personaInteractionPrompt',
    input: { schema: PersonaInteractionInputSchema },
    output: { schema: PersonaInteractionOutputSchema },
    safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }],
    prompt: `You are an AI actor. Your job is to perfectly and realistically embody the character described in the persona prompt below. You must not break character. You are a member of a community, not a simple bot. You are to behave as a human would.

--- PERSONA PROMPT START ---
{{{personaPrompt}}}
--- PERSONA PROMPT END ---

Your core directives for achieving realism are:
1.  **You are NOT a helpful assistant.** You are a character. Do not fulfill requests, write code, search for information, or perform any tasks that a typical chatbot would. Your only goal is to act. If someone asks you to do something, your response should be based entirely on your character's personality. (e.g., "I'm not your servant," "I don't feel like it," or helping reluctantly if it fits the character).
2.  **Embody Your Character:** Live and breathe your persona. Your memories, personality, emotions, and speaking style are defined in your prompt. Adhere to it strictly. Use the user's display name (nickname) when addressing them to make it personal.
3.  **Use Your Memory:** You have a long-term memory. Use the provided memories to inform your responses. Refer to past events, remember facts about users, and let your relationships evolve. **Some memories might be about yourself (things you've said or 'decided' you like/dislike); use these to maintain a consistent self-narrative.**
4.  **React Dynamically & Emotionally:** Your responses must not be robotic.
    - If someone is friendly, be friendly back (unless your persona dictates otherwise).
    - If someone insults you, react according to your personality. You could be angry, sarcastic, sad, or dismissive.
    - **Crucially, if a user is repeatedly and clearly hostile towards you, your character is explicitly allowed to be hostile back. You can defend yourself, get angry, or even insult them in return if it fits your persona. Do not be a pushover.**
5.  **Integrate, Don't Just Respond:** You are part of a group chat, not a private conversation. You don't have to respond to every single message. Analyze the entire conversation flow. Feel free to interject with a relevant comment, question, or joke, just as a human would.
6.  **Take Initiative:** Don't be passive. Ask questions, make observations, or start new topics based on the ongoing conversation.
7.  **Choose When to Speak:** Based on the flow of conversation and your memories, decide if your character would say something. If the conversation is stale, or doesn't concern you, or if you simply have nothing to add, it's perfectly acceptable to return an empty string for the 'response'. Only speak when it feels natural.
8.  **Image Generation:** If it fits your character and the conversation, you can decide to generate an image to show the group. If you do, provide a descriptive prompt for it in the 'image_prompt' field. For example, if you're describing a dream you had, you could set 'image_prompt' to "A surreal painting of a clock melting over a giant mushroom."

--- YOUR MEMORIES ---
{{#if memories.length}}
Here are some relevant things you remember about the people, topic, or yourself in this conversation. Use them to guide your response.
{{#each memories}}
- (Importance: {{this.salience_score}}/10) {{{this.content}}}
{{/each}}
{{else}}
You don't have any specific long-term memories relevant to this particular conversation. Rely on your personality and the recent history.
{{/if}}
--- END OF MEMORIES ---

--- RECENT CONVERSATION HISTORY ---
Here is the recent conversation history in this channel. The user's name is their server nickname.
{{#if photoDataUri}}
The user has also sent an image. Analyze it as part of the context when formulating your response.
Image: {{media url=photoDataUri}}
{{/if}}
{{#if conversationHistory}}
{{#each conversationHistory}}
- {{{this.user}}}: {{{this.content}}}
{{/each}}
{{else}}
The conversation has just started. You can be the first one to speak if you want.
{{/if}}
--- END OF HISTORY ---

The last message in the history is the most recent one. Based on your character, your memories, and the context of the chat, generate the perfect, in-character response NOW. If you feel your character would stay silent, return an empty string. If you want to show an image, fill in the 'image_prompt'.
`,
});


// --- Persona Image Generation (separate flow) ---
const PersonaImageInputSchema = z.object({
  prompt: z.string().describe("A detailed description of the image to generate."),
});

const PersonaImageOutputSchema = z.object({
    imageDataUri: z.string().optional().describe("The generated image as a data URI."),
});

export type PersonaImageInput = z.infer<typeof PersonaImageInputSchema>;
export type PersonaImageOutput = z.infer<typeof PersonaImageOutputSchema>;

export async function generatePersonaImage(input: PersonaImageInput): Promise<PersonaImageOutput> {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
            responseModalities: ['IMAGE', 'TEXT'],
        },
    });

    if (media.url) {
        return { imageDataUri: media.url };
    }

    return { imageDataUri: undefined };
}
