

import { Events, Message, Collection, TextChannel } from 'discord.js';
import { getServerConfig, getPersonasForGuild, getMemoriesForPersona, createMultipleMemories } from '../../../src/lib/db';
import { personaInteractionFlow } from '../../../src/ai/flows/persona-flow';
import { memoryFlow } from '../../../src/ai/flows/memory-flow';
import type { Persona, ConversationHistoryItem } from '@/types';
import fetch from 'node-fetch';

const imageMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const PERSONA_WEBHOOK_NAME = "Marcus Persona";


// Helper to convert image URL to data URI
async function imageUrlToDataUri(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !imageMimeTypes.includes(contentType)) {
        throw new Error('Invalid content type for image.');
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
}


// Cache conversation histories
const conversationHistory = new Collection<string, ConversationHistoryItem[]>();
const HISTORY_LIMIT = 20; // Increased history limit for better context

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (message.author.bot || !message.guild || !message.member) {
        return;
    }

    const config = await getServerConfig(message.guild.id, 'ai-personas');
    if (!config?.enabled || !config.premium) {
        return;
    }

    const personas = getPersonasForGuild(message.guild.id);
    if (personas.length === 0) return;

    const activePersona = personas.find(p => p.active_channel_id === message.channel.id);
    const mentionedPersona = personas.find(p => p.role_id && message.mentions.roles.has(p.role_id));

    // A persona is triggered if it's active in the channel OR if its role is mentioned.
    const triggeredPersona = activePersona || mentionedPersona;

    if (!triggeredPersona) {
        return;
    }
    
    // The persona should not respond to itself if it was somehow triggered by its own message via webhook.
    if (message.webhookId && message.author.username.toLowerCase() === triggeredPersona.name.toLowerCase()) {
        return;
    }
    
    // Check for image attachments in the user's message
    const imageAttachment = message.attachments.find(att => imageMimeTypes.some(mime => att.contentType?.startsWith(mime)));
    
    // The persona should only be triggered if there is text content, an image, or it was mentioned.
    if (!message.content && !imageAttachment && !mentionedPersona) {
        return;
    }

    console.log(`[Persona] Triggered: Persona "${triggeredPersona.name}" is processing a message from ${message.author.tag} in #${(message.channel as TextChannel).name}.`);
    
    try {
        await message.channel.sendTyping();
        
        let photoDataUri: string | undefined = undefined;
        if (imageAttachment) {
            try {
                photoDataUri = await imageUrlToDataUri(imageAttachment.url);
            } catch (error) {
                console.error(`[Persona] Failed to process image for persona:`, error);
                // Do not stop the flow, just proceed without the image
            }
        }

        // --- Conversation History Handling ---
        const historyKey = message.channel.id;
        const currentHistory = conversationHistory.get(historyKey) || [];
        
        // Add the current message to the history for context
        let messageTextForHistory = message.content;
        if (mentionedPersona) {
            // Remove the role mention from the text to make the history cleaner
            messageTextForHistory = message.content.replace(`<@&${mentionedPersona.role_id}>`, '').trim();
        }
        currentHistory.push({ user: message.member.displayName, content: messageTextForHistory });

        if (currentHistory.length > HISTORY_LIMIT) {
            currentHistory.shift();
        }
        conversationHistory.set(historyKey, currentHistory);
        // --- End of History Handling ---

        // --- Memory Retrieval ---
        const relevantMemories = getMemoriesForPersona(triggeredPersona.id, [message.author.id]);
        console.log(`[Persona] Retrieved ${relevantMemories.length} relevant memories for "${triggeredPersona.name}".`);
        // --- End of Memory Retrieval ---

        const result = await personaInteractionFlow({
            personaPrompt: triggeredPersona.persona_prompt,
            conversationHistory: currentHistory, 
            memories: relevantMemories.map(m => ({ content: m.content, salience_score: m.salience_score })),
            photoDataUri: photoDataUri,
        });

        // --- Handle Response and Memory Creation ---
        if (result.response) {
            const targetChannel = message.channel as TextChannel;
            const webhooks = await targetChannel.fetchWebhooks();
            let webhook = webhooks.find(wh => wh.name === PERSONA_WEBHOOK_NAME && wh.token !== null);

            if (!webhook) {
                webhook = await targetChannel.createWebhook({
                    name: PERSONA_WEBHOOK_NAME,
                    reason: 'Webhook for AI Personas'
                });
            }
            
            await webhook.send({
                content: result.response,
                username: triggeredPersona.name,
                avatarURL: triggeredPersona.avatar_url || message.client.user?.displayAvatarURL()
            });
            
            const updatedHistory = conversationHistory.get(historyKey) || [];
            updatedHistory.push({ user: triggeredPersona.name, content: result.response });
            if (updatedHistory.length > HISTORY_LIMIT) {
                updatedHistory.shift();
            }
            conversationHistory.set(historyKey, updatedHistory);

            // After responding, trigger the memory creation flow asynchronously
            console.log(`[Persona Memory] Triggering memory creation for "${triggeredPersona.name}".`);
            memoryFlow({
                persona_id: triggeredPersona.id,
                conversationTranscript: updatedHistory.map(h => `${h.user}: ${h.content}`).join('\n')
            }).then(newMemories => {
                if (newMemories && newMemories.length > 0) {
                     console.log(`[Persona Memory] Creating ${newMemories.length} new memories for ${triggeredPersona.name}.`);
                     createMultipleMemories(newMemories);
                } else {
                    console.log(`[Persona Memory] No new significant memories to create for "${triggeredPersona.name}".`);
                }
            }).catch(err => console.error(`[Persona Memory] Error creating memories for "${triggeredPersona.name}":`, err));

        } else {
             console.log(`[Persona] Persona "${triggeredPersona.name}" chose not to respond.`);
        }

    } catch (error) {
        console.error(`[Persona] Error during interaction flow for "${triggeredPersona.name}":`, error);
        // Don't send an error message in the channel to avoid breaking immersion.
    }
}
