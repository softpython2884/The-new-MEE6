
import { Events, GuildChannel, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.ChannelCreate;

export async function execute(channel: GuildChannel) {
    if (!channel.guild) return;

    const config = await getServerConfig(channel.guild.id, 'logs');
    if (!config?.enabled || !config['log-channels'] || !config.log_channel_id) return;
    
    // Check for exemptions
    if (config.exempt_channels.includes(channel.id)) return;
    if (channel.parentId && config.exempt_channels.includes(channel.parentId)) return;


    const logChannel = await channel.guild.channels.fetch(config.log_channel_id).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0x00FF00) // Green
        .setTitle('Salon Créé')
        .setDescription(`Le salon **${channel.name}** a été créé.`)
        .addFields(
            { name: 'Nom du Salon', value: `<#${channel.id}>`, inline: true },
            { name: 'Type', value: `${channel.type}`, inline: true },
            { name: 'ID du Salon', value: `\`${channel.id}\``, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `ID du Serveur: ${channel.guild.id}` });

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de création de salon pour le serveur ${channel.guild.id}:`, error);
    }
}
