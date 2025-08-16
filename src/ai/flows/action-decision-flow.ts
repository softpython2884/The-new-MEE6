'use server';

/**
 * @fileOverview An AI agent that decides on proactive actions for a persona in a quiet channel.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ActionDecisionInputSchema = z.object({
    personaName: z.string().describe("The name of the persona that is deciding on an action."),
    lastConversation: z.object({
        user: z.string().describe("The user from the last significant conversation."),
        topic: z.string().describe("The topic of that conversation."),
    }).optional().describe("Information about the last relevant conversation."),
    channelIdleTimeMinutes: z.number().describe("How many minutes the channel has been quiet."),
});

const ActionDecisionOutputSchema = z.object({
    action: z.enum(['start_conversation', 'follow_up', 'share_content', 'do_nothing'])
        .describe("The action the persona decides to take."),
    content: z.string().optional()
        .describe("The message to send, or the prompt for image generation."),
    image_prompt: z.string().optional()
        .describe("If the action is 'share_content' with an image, this is the prompt for the image generation model.")
});

export async function actionDecisionFlow(input: z.infer<typeof ActionDecisionInputSchema>): Promise<z.infer<typeof ActionDecisionOutputSchema>> {
    const { output } = await actionDecisionPrompt(input);
    return output!;
}


const actionDecisionPrompt = ai.definePrompt({
  name: 'actionDecisionPrompt',
  input: { schema: ActionDecisionInputSchema },
  output: { schema: ActionDecisionOutputSchema },
  prompt: `Tu es {personaName}. Le salon est calme depuis {channelIdleTimeMinutes} minutes. Tes derniers souvenirs indiquent que tu as eu une bonne conversation avec {lastConversation.user} à propos de {lastConversation.topic}. Décide d'une action : 1. start_conversation: Initier une nouvelle conversation sur un sujet lié. 2. follow_up: Relancer {lastConversation.user} sur votre discussion précédente. 3. share_content: Générer une image ou partager un fait intéressant lié à tes passions. 4. do_nothing: Rester silencieux. Fournis l'action et le contenu associé (le message à envoyer, ou le prompt de l'image).`,
});
