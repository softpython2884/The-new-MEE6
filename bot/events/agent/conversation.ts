
import { Events, Message } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';
import { conversationalAgentFlow } from '../../../src/ai/flows/conversational-agent-flow';
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


export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    // Ignore bots, and messages that don't mention the bot
    if (message.author.bot || !message.mentions.has(message.client.user.id)) {
        return;
    }

    if (!message.guild) return;

    const config = await getServerConfig(message.guild.id, 'conversational-agent');

    // Check if the module is enabled and premium
    if (!config?.enabled || !config.premium) {
        return;
    }

    // Remove the bot's mention from the message to get the actual prompt
    const userMessage = message.content.replace(/<@!?\d+>/, '').trim();

    // Check for an image attachment
    const imageAttachment = message.attachments.find(att => imageMimeTypes.some(mime => att.contentType?.startsWith(mime)));
    
    // If there is no text and no image, do nothing
    if (!userMessage && !imageAttachment) {
        // The user just pinged the bot without a message
        return;
    }
    
    console.log(`[Agent] Received message from ${message.author.tag} in ${message.guild.name}.`);

    try {
        // Start typing indicator
        await message.channel.sendTyping();

        let photoDataUri: string | undefined = undefined;
        if (imageAttachment) {
            photoDataUri = await imageUrlToDataUri(imageAttachment.url);
        }

        const result = await conversationalAgentFlow({
            userMessage: userMessage,
            userName: message.author.username,
            photoDataUri: photoDataUri,
            agentName: config.agent_name,
            agentRole: config.agent_role,
            agentPersonality: config.agent_personality,
            customPrompt: config.custom_prompt,
            knowledgeBase: config.knowledge_base,
        });

        if (result.response) {
            await message.reply(result.response);
        }

    } catch (error) {
        console.error('[Agent] Error during conversational agent flow:', error);
        await message.reply("Désolé, une erreur est survenue pendant que je réfléchissais. Veuillez réessayer.");
    }
}
