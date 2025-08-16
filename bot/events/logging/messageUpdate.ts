

import { Events, Message, PartialMessage, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.MessageUpdate;

export async function execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (newMessage.author?.bot || !newMessage.guild || oldMessage.content === newMessage.content) return;
    
    const config = await getServerConfig(newMessage.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.messages?.enabled) return;

    // Check for exemptions
    if (newMessage.member?.roles.cache.some(r => config.exempt_roles?.includes(r.id))) return;
    if (config.exempt_channels?.includes(newMessage.channel.id)) return;

    const targetChannelId = config.log_settings.messages.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await newMessage.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel || logChannel.id === newMessage.channel.id) return;

    const embed = new EmbedBuilder()
        .setColor(0x3399FF) // Light Blue
        .setTitle('Message Modifié')
        .setDescription(`Le message de **${newMessage.author?.tag}** a été modifié dans <#${newMessage.channel.id}>. [Aller au message](${newMessage.url})`)
        .addFields(
            { name: 'Ancien Contenu', value: oldMessage.content ? `\`\`\`${oldMessage.content.substring(0, 1020)}\`\`\`` : 'Impossible de récupérer le contenu.', inline: false },
            { name: 'Nouveau Contenu', value: newMessage.content ? `\`\`\`${newMessage.content.substring(0, 1020)}\`\`\`` : 'Impossible de récupérer le contenu.', inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `Auteur ID: ${newMessage.author?.id} | Message ID: ${newMessage.id}` });

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de modification de message pour le serveur ${newMessage.guild.id}:`, error);
    }
}
