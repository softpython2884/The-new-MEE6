

import { Events, Message } from 'discord.js';
import { imageFilterFlow } from '../../../src/ai/flows/image-filter-flow';
import fetch from 'node-fetch';
import { getServerConfig } from '../../../src/lib/db';

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
    const buffer = await response.buffer();
    return `data:${contentType};base64,${buffer.toString('base64')}`;
}


export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (!message.guild || message.author.bot) return;

    // Check for image attachments
    const imageAttachment = message.attachments.find(att => imageMimeTypes.some(mime => att.contentType?.startsWith(mime)));
    if (!imageAttachment) return;

    const filterConfig = await getServerConfig(message.guild.id, 'image-filter');

    if (!filterConfig?.enabled || filterConfig.sensitivity === 'low') {
        return;
    }
    
    console.log(`[Image-Filter] Analyzing image from ${message.author.tag} in ${message.guild.name}. Sensitivity: ${filterConfig.sensitivity}`);

    try {
        const photoDataUri = await imageUrlToDataUri(imageAttachment.url);

        const result = await imageFilterFlow({
            photoDataUri,
            sensitivity: filterConfig.sensitivity as 'low' | 'medium' | 'high',
        });

        if (result.isCensored) {
            console.log(`[Image-Filter] Censoring image from ${message.author.tag}. Reason: ${result.reason}`);
            
            // 1. Delete the message
            await message.delete();

            // 2. Send the explanation
            await message.channel.send({
                content: `> **${message.author.toString()}, votre image a été supprimée par la modération automatique.**\n> **Raison :** ${result.reason}`,
            });
        }

    } catch (error) {
        console.error('[Image-Filter] Error during image analysis flow:', error);
    }
}
