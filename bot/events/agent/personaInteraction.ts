

import { Events, Message, Collection } from 'discord.js';
import { getServerConfig, getPersonasForGuild, getMemoriesForPersona, createMultipleMemories } from '../../../src/lib/db';
import { personaInteractionFlow } from '../../../src/ai/flows/persona-flow';
import { memoryFlow } from '../../../src/ai/flows/memory-flow';
import type { Persona, ConversationHistoryItem } from '@/types';
import fetch from 'node-fetch';

const imageMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

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
    const activePersona = personas.find(p => p.active_channel_id === message.channel.id);

    // If no persona is active in this channel, do nothing.
    if (!activePersona) {
        return;
    }

    // The persona should not respond to itself if it was somehow triggered by its own message.
    if (message.author.username.toLowerCase() === activePersona.name.toLowerCase()) {
        return;
    }
    
    // Check for image attachments in the user's message
    const imageAttachment = message.attachments.find(att => imageMimeTypes.some(mime => att.contentType?.startsWith(mime)));
    
    // The persona should only be triggered if there is text content or an image.
    if (!message.content && !imageAttachment) {
        return;
    }

    console.log(`[Persona] Persona "${activePersona.name}" is processing a message from ${message.author.tag} in #${message.channel.name}.`);
    
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
        
        currentHistory.push({ user: message.member.displayName, content: message.content });
        if (currentHistory.length > HISTORY_LIMIT) {
            currentHistory.shift();
        }
        conversationHistory.set(historyKey, currentHistory);
        // --- End of History Handling ---

        // --- Memory Retrieval ---
        const uniqueUserIdsInHistory = [...new Set(currentHistory.map(h => message.guild?.members.cache.find(m => m.displayName === h.user)?.id).filter(Boolean) as string[])];
        const relevantMemories = getMemoriesForPersona(activePersona.id, uniqueUserIdsInHistory);
        // --- End of Memory Retrieval ---

        const result = await personaInteractionFlow({
            personaPrompt: activePersona.persona_prompt,
            conversationHistory: currentHistory, 
            memories: relevantMemories.map(m => ({ content: m.content, salience_score: m.salience_score })),
            photoDataUri: photoDataUri,
        });

        // --- Handle Response and Memory Creation ---
        if (result.response) {
            const responseMessage = await message.reply(result.response);
            
            const updatedHistory = conversationHistory.get(historyKey) || [];
            updatedHistory.push({ user: activePersona.name, content: responseMessage.content });
            if (updatedHistory.length > HISTORY_LIMIT) {
                updatedHistory.shift();
            }
            conversationHistory.set(historyKey, updatedHistory);

            // After responding, trigger the memory creation flow asynchronously
            // We don't need to wait for this to finish.
            memoryFlow({
                persona_id: activePersona.id,
                conversationTranscript: updatedHistory.map(h => `${h.user}: ${h.content}`).join('\n')
            }).then(newMemories => {
                if (newMemories && newMemories.length > 0) {
                     console.log(`[Persona Memory] Creating ${newMemories.length} new memories for ${activePersona.name}.`);
                     createMultipleMemories(newMemories);
                }
            }).catch(err => console.error(`[Persona Memory] Error creating memories:`, err));

        }

    } catch (error) {
        console.error(`[Persona] Error during interaction flow for "${activePersona.name}":`, error);
        // Don't send an error message in the channel to avoid breaking immersion.
    }
}
