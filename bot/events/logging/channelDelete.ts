

import { Events, GuildChannel, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.ChannelDelete;

export async function execute(channel: GuildChannel) {
    if (!channel.guild) return;

    const config = await getServerConfig(channel.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.channels?.enabled) return;
    
    // Check for exemptions
    if (config.exempt_channels?.includes(channel.id)) return;
    if (channel.parentId && config.exempt_channels?.includes(channel.parentId)) return;

    const targetChannelId = config.log_settings.channels.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await channel.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red
        .setTitle('Salon Supprimé')
        .setDescription(`Le salon **#${channel.name}** a été supprimé.`)
        .addFields(
            { name: 'Nom du Salon', value: `#${channel.name}`, inline: true },
            { name: 'Type', value: `${channel.type}`, inline: true },
            { name: 'ID du Salon', value: `\`${channel.id}\``, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `ID du Serveur: ${channel.guild.id}` });

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de suppression de salon pour le serveur ${channel.guild.id}:`, error);
    }
}
