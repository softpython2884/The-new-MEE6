
import { Events, Message, TextChannel } from 'discord.js';
import { getServerConfig } from '../../src/lib/db';
import { autoTranslateFlow } from '../../src/ai/flows/auto-translate-flow';

export const name = Events.MessageCreate;
export const once = false;

async function handleAutoTranslate(message: Message) {
    if (!message.guild || message.author.bot || !message.content) return;

    const config = await getServerConfig(message.guild.id, 'auto-translation');
    const isPremium = config?.premium || false;

    if (!config?.enabled || !isPremium || !config.channels.includes(message.channel.id)) {
        return;
    }

    try {
        const result = await autoTranslateFlow({
            textToTranslate: message.content,
            targetLanguage: 'French', // Or make this configurable in the panel
        });

        if (result.translationNeeded && result.translatedText) {
            const targetChannel = await message.guild.channels.fetch(message.channel.id) as TextChannel;
            if (!targetChannel) return;

            const embed = {
                color: 0x3498DB, // Blue
                description: `**Traduction :** ${result.translatedText}`,
                footer: {
                    text: `Message original de ${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL(),
                },
            };

            if (config.mode === 'inline') {
                await message.reply({ embeds: [embed] });
            } else if (config.mode === 'replace') {
                await message.delete();
                await targetChannel.send({
                    content: `_Message de ${message.author.toString()}:_`,
                    embeds: [embed],
                });
            }
        }
    } catch (error) {
        console.error('[AutoTranslate] Error during translation flow:', error);
    }
}


export async function execute(message: Message) {
    if (message.author.bot) return;

    // Run all message-based handlers
    await Promise.all([
        handleAutoTranslate(message),
        // Other handlers like auto-moderation could be added here
    ]);
    
    return;
}
