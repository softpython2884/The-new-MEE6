

import { Events, Message, Collection } from 'discord.js';
import { getServerConfig, getPersonasForGuild } from '../../../src/lib/db';
import { personaInteractionFlow } from '../../../src/ai/flows/persona-flow';
import type { Persona, ConversationHistoryItem } from '@/types';

// Cache conversation histories
const conversationHistory = new Collection<string, ConversationHistoryItem[]>();
const HISTORY_LIMIT = 20; // Increased history limit for better context

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (message.author.bot || !message.guild) {
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

    console.log(`[Persona] Persona "${activePersona.name}" is processing a message from ${message.author.tag} in #${message.channel.name}.`);
    
    try {
        await message.channel.sendTyping();

        // --- Conversation History Handling ---
        const historyKey = message.channel.id;
        const currentHistory = conversationHistory.get(historyKey) || [];
        
        // Add the new message to the history and trim it
        currentHistory.push({ user: message.author.username, content: message.content });
        if (currentHistory.length > HISTORY_LIMIT) {
            currentHistory.shift();
        }
        conversationHistory.set(historyKey, currentHistory);
        // --- End of History Handling ---


        const result = await personaInteractionFlow({
            personaPrompt: activePersona.persona_prompt,
            conversationHistory: currentHistory, // Send the full, updated history
        });

        if (result.response) {
            const responseMessage = await message.reply(result.response);
            
            // Add the persona's response to the history
            const updatedHistory = conversationHistory.get(historyKey) || [];
            updatedHistory.push({ user: activePersona.name, content: responseMessage.content });
            if (updatedHistory.length > HISTORY_LIMIT) {
                updatedHistory.shift();
            }
            conversationHistory.set(historyKey, updatedHistory);
        }

    } catch (error) {
        console.error(`[Persona] Error during interaction flow for "${activePersona.name}":`, error);
        // Don't send an error message in the channel to avoid breaking immersion.
    }
}
