

import { Events, GuildChannel, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.ChannelUpdate;

export async function execute(oldChannel: GuildChannel, newChannel: GuildChannel) {
    if (!newChannel.guild) return;

    const config = await getServerConfig(newChannel.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.channels?.enabled) return;
    
    // Check for exemptions
    if (config.exempt_channels?.includes(newChannel.id)) return;
    if (newChannel.parentId && config.exempt_channels?.includes(newChannel.parentId)) return;

    const targetChannelId = config.log_settings.channels.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await newChannel.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0x0000FF) // Blue
        .setTitle('Salon Mis à Jour')
        .setTimestamp()
        .setFooter({ text: `ID du Serveur: ${newChannel.guild.id}` });

    if (oldChannel.name !== newChannel.name) {
        embed.setDescription(`Le salon <#${newChannel.id}> a été renommé.`);
        embed.addFields(
            { name: 'Ancien Nom', value: oldChannel.name, inline: true },
            { name: 'Nouveau Nom', value: newChannel.name, inline: true }
        );
    } else {
        embed.setDescription(`Les permissions ou paramètres du salon <#${newChannel.id}> ont été mis à jour.`);
         embed.addFields({ name: 'Salon', value: `<#${newChannel.id}>`, inline: true });
    }

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de mise à jour de salon pour le serveur ${newChannel.guild.id}:`, error);
    }
}
