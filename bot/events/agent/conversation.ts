
import { Events, Message, Collection } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';
import { conversationalAgentFlow } from '../../../src/ai/flows/conversational-agent-flow';
import fetch from 'node-fetch';

const imageMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

// Cache to store conversation history for dedicated channels
const conversationHistory = new Collection<string, { user: string; content: string }[]>();
const HISTORY_LIMIT = 10; // Keep the last 10 messages

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


export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (message.author.bot || !message.guild) {
        return;
    }

    const config = await getServerConfig(message.guild.id, 'conversational-agent');

    // Check if the module is enabled and premium
    if (!config?.enabled || !config.premium) {
        return;
    }
    
    const isMentioned = message.mentions.has(message.client.user.id);
    const isInDedicatedChannel = message.channel.id === config.dedicated_channel_id;

    // The bot should only respond if it's mentioned OR if the message is in the dedicated channel
    if (!isMentioned && !isInDedicatedChannel) {
        return;
    }

    // Remove the bot's mention from the message to get the actual prompt
    const userMessage = message.content.replace(/<@!?\d+>/, '').trim();

    // Check for an image attachment
    const imageAttachment = message.attachments.find(att => imageMimeTypes.some(mime => att.contentType?.startsWith(mime)));
    
    // If there is no text and no image, do nothing (e.g. user just pinged the bot)
    if (!userMessage && !imageAttachment) {
        return;
    }
    
    console.log(`[Agent] Received message from ${message.author.tag} in ${message.guild.name}. Trigger: ${isInDedicatedChannel ? 'Dedicated Channel' : 'Mention'}`);

    try {
        await message.channel.sendTyping();

        let photoDataUri: string | undefined = undefined;
        if (imageAttachment) {
            photoDataUri = await imageUrlToDataUri(imageAttachment.url);
        }

        // --- Conversation History Handling for Dedicated Channel ---
        let historyForPrompt = [];
        if (isInDedicatedChannel) {
            const currentHistory = conversationHistory.get(message.channel.id) || [];
            historyForPrompt = [...currentHistory]; // Pass a copy to the flow

            // Add the new message to the history and trim it
            currentHistory.push({ user: message.author.username, content: userMessage });
            if (currentHistory.length > HISTORY_LIMIT) {
                currentHistory.shift();
            }
            conversationHistory.set(message.channel.id, currentHistory);
        }
        // --- End of History Handling ---

        const result = await conversationalAgentFlow({
            userMessage: userMessage,
            userName: message.author.username,
            photoDataUri: photoDataUri,
            agentName: config.agent_name,
            agentRole: config.agent_role,
            agentPersonality: config.agent_personality,
            customPrompt: config.custom_prompt,
            knowledgeBase: config.knowledge_base,
            conversationHistory: historyForPrompt, // Pass history to the flow
        });

        if (result.response) {
            await message.reply(result.response);
             // If in dedicated channel, add the bot's response to history as well
            if (isInDedicatedChannel) {
                const currentHistory = conversationHistory.get(message.channel.id) || [];
                currentHistory.push({ user: config.agent_name, content: result.response });
                if (currentHistory.length > HISTORY_LIMIT) {
                    currentHistory.shift();
                }
                conversationHistory.set(message.channel.id, currentHistory);
            }
        }

    } catch (error) {
        console.error('[Agent] Error during conversational agent flow:', error);
        await message.reply("Désolé, une erreur est survenue pendant que je réfléchissais. Veuillez réessayer.");
    }
}
