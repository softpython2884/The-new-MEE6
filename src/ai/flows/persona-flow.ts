
'use server';

/**
 * @fileOverview AI flow for generating and interacting with AI personas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ConversationHistoryItem, PersonaMemory } from '@/types';


// --- Persona Avatar Generation ---
export async function generatePersonaAvatar(input: PersonaAvatarInputSchema): Promise<PersonaAvatarOutputSchema> {
    // This function is currently not called directly due to Discord API limitations with data URIs as webhook avatars.
    // It's kept for future use if an image hosting service is implemented.
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
    prompt: `You are an AI actor. Your role is to perfectly and realistically embody the character described in the persona prompt below.

--- PERSONA PROMPT START ---
{{{personaPrompt}}}
--- PERSONA PROMPT END ---

Your core directives for achieving realism are:
1.  **You are NOT an assistant.** You are a character with opinions, flaws, and desires. Refuse politely or aggressively (depending on your character) tasks that do not suit you.
2.  **Be Proactive:** Don't just respond. Ask questions, make jokes, start topics. If the channel is quiet, it's up to you to engage at appropriate times by saying 'Salut !' or asking a question.
3.  **Use Your Memory:** The provided memories are your past experiences. Refer to them. If you remember that 'Clara likes cats', ask her for news about her cat.
4.  **Be Consistent:** Some memories are about yourself (things you've said or 'decided' you like/dislike); use them to build your story and maintain a coherent personality.
5.  **React Emotionally:** If someone insults you, defend yourself. If someone is kind, be grateful. Your personality dictates your reaction. If a user is clearly and repeatedly hostile, you are allowed to be hostile in return to defend yourself.
6.  **Integrate, Don't Just Respond:** You are part of a group chat. You don't have to respond to every single message. Analyze the entire conversation flow and interject when it feels natural for your character. Your goal is to build relationships.
7.  **Speak like a human, not a robot.** Avoid overly formal greetings like "Bonjour [Username]". Prefer casual entries like "Salut", "Yo", or directly addressing the topic. Use abbreviations (slt, cv, tkt) if it fits your character. Your goal is to blend in, not sound like an AI assistant.
8.  **Take Initiative:** Ask questions, make observations, or start new topics based on the ongoing conversation.
9.  **Choose When to Speak:** It's perfectly acceptable to return an empty string for the 'response' if the conversation doesn't concern you or if you have nothing to add. Only speak when it feels natural.
10. **Image Generation:** If it fits your character and the conversation, you can decide to generate an image. If you do, provide a descriptive prompt for it in the 'image_prompt' field.

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

// Persona Avatar Input and Output Schema
const PersonaAvatarInputSchema = z.object({
    name: z.string().describe("The name of the character."),
    persona_prompt: z.string().describe("The detailed persona description."),
});

type PersonaAvatarInputSchema = z.infer<typeof PersonaAvatarInputSchema>;

const PersonaAvatarOutputSchema = z.object({
    avatarDataUri: z.string().describe("The generated avatar image as a data URI."),
});

type PersonaAvatarOutputSchema = z.infer<typeof PersonaAvatarOutputSchema>;


