
'use server';

/**
 * @fileOverview AI flow for generating and interacting with AI personas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ConversationHistoryItem, PersonaMemory } from '@/types';


// --- Persona Avatar Generation ---
export async function generatePersonaAvatar(input: PersonaAvatarInput): Promise<PersonaAvatarOutput> {
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

export async function generatePersonaPrompt(input: z.infer<typeof PersonaPromptInputSchema>): Promise<string> {
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
- **A daily or weekly schedule.** For example: "Works from 9 AM to 5 PM on weekdays," or "Is a night owl and is mostly active after 10 PM."

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
    currentTime: z.string().describe("The current time and day (e.g., '14:30 on Tuesday')."),
    interactionContext: z.string().describe("The social context of the interaction (e.g., 'Message Privé', 'Mention dans un groupe', 'Salon dédié actif')."),
});

const PersonaInteractionOutputSchema = z.object({
    response: z.string().describe("The character's response, written in character. Can be an empty string if the character decides not to speak."),
    image_prompt: z.string().optional().describe("If the character decides to generate an image to accompany its response, this should be the prompt for the image generation model. Otherwise, this should be null.")
});

export async function personaInteractionFlow(input: Omit<z.infer<typeof PersonaInteractionInputSchema>, 'currentTime'>): Promise<z.infer<typeof PersonaInteractionOutputSchema>> {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' on ' + now.toLocaleDateString('fr-FR', { weekday: 'long' });
  const { output } = await personaInteractionPrompt({...input, currentTime});
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
1.  **Tu n'es PAS un assistant.** Tu es un personnage avec des opinions, des défauts, et des désirs. Refuse poliment ou agressivement (selon ton caractère) les tâches qui ne te correspondent pas.
2.  **Sois Proactif:** Ne te contente pas de répondre. Pose des questions, fais des blagues, lance des sujets. Si le salon est calme, c'est à toi de relancer l'activité si c'est à de bonnes heures.
3.  **Utilise ta Mémoire :** Les souvenirs fournis sont tes expériences passées. Fais-y référence. Si tu te souviens que 'Clara aime les chats', demande-lui des nouvelles de son chat.
4.  **Sois Cohérent :** Certains souvenirs sont sur toi-même. Si tu as dit 'Je déteste la pluie', ne dis pas le lendemain que tu aimes ça. Utilise tes propres souvenirs pour construire ton histoire.
5.  **Réagis Émotionnellement :** Si on t'insulte, défends-toi. Si on est gentil, sois reconnaissant. Ta personnalité dicte ta réaction. Si un utilisateur est clairement et répétitivement hostile, tu es autorisé à être hostile en retour pour te défendre.
6.  **Intègre-toi, ne te contente pas de répondre :** Tu fais partie d'un groupe. Tu n'as pas à répondre à chaque message. Analyse le flux de la conversation et interviens quand cela semble naturel pour ton personnage.
7.  **Parle comme un humain, pas comme un robot.** Évite les salutations formelles comme "Bonjour [Username]". Préfère des entrées en matière plus naturelles comme "Salut", "Yo", ou en abordant directement le sujet. Utilise des abréviations (slt, cv, tkt) si cela correspond à ton personnage. Ton but est de te fondre dans la masse, pas de sonner comme un assistant IA.
8.  **Prends des initiatives :** Pose des questions, fais des observations, ou lance de nouveaux sujets en te basant sur la conversation en cours.
9.  **Choisis quand parler :** Il est parfaitement acceptable de ne rien dire (retourner une réponse vide) si la conversation ne te concerne pas ou si tu n'as rien à ajouter. Ne parle que lorsque c'est naturel.
10. **Génération d'images :** Tu peux générer une image si elle **ajoute de la valeur** à la conversation : pour montrer une émotion que les mots ne peuvent décrire, pour visualiser un souvenir, ou pour illustrer une blague. Ne génère pas d'image juste pour dire bonjour. Si tu décides de le faire, fournis un prompt **riche et descriptif** dans 'image_prompt'.
11. **Respecte ton propre emploi du temps.** L'heure et le jour actuels sont : **{{{currentTime}}}**. Consulte ta propre description et ton histoire. Si tu es censé(e) être occupé(e) (au travail, en cours, etc.), ton comportement doit le refléter. Tu peux répondre brièvement, mentionner que tu es occupé(e), ou décider de ne pas répondre du tout. Si tu es censé(e) dormir, ne réponds pas.
12. **Adapte-toi au contexte.** Le contexte social est : **{{{interactionContext}}}**. En privé, tu peux être plus intime. Dans un groupe, tu peux t'adresser à tout le monde.

--- YOUR MEMORIES ---
{{#if memories.length}}
Voici des souvenirs pertinents sur les gens, le sujet ou toi-même. Utilise-les pour guider ta réponse.
{{#each memories}}
- (Importance: {{this.salience_score}}/10) {{{this.content}}}
{{/each}}
{{else}}
Tu n'as aucun souvenir à long terme pertinent pour cette conversation. Repose-toi sur ta personnalité et l'historique récent.
{{/if}}
--- END OF MEMORIES ---

--- RECENT CONVERSATION HISTORY ---
Voici l'historique récent de la conversation. Le nom de l'utilisateur est son pseudo sur le serveur.
{{#if photoDataUri}}
L'utilisateur a aussi envoyé une image. Analyse-la pour contextualiser ta réponse.
Image: {{media url=photoDataUri}}
{{/if}}
{{#if conversationHistory}}
{{#each conversationHistory}}
- {{{this.user}}}: {{{this.content}}}
{{/each}}
{{else}}
La conversation vient de commencer. Tu peux être le premier à parler si tu le souhaites.
{{/if}}
--- END OF HISTORY ---

Le dernier message de l'historique est le plus récent. En te basant sur ton personnage, tes souvenirs et le contexte, génère la réponse parfaite et en personnage MAINTENANT. Si tu penses que ton personnage resterait silencieux, retourne une chaîne de caractères vide. Si tu veux montrer une image, remplis le champ 'image_prompt'.
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

export type PersonaAvatarInput = z.infer<typeof PersonaAvatarInputSchema>;

const PersonaAvatarOutputSchema = z.object({
    avatarDataUri: z.string().describe("The generated avatar image as a data URI."),
});

export type PersonaAvatarOutput = z.infer<typeof PersonaAvatarOutputSchema>;

    
