import { Events, GuildChannel, EmbedBuilder, TextChannel } from 'discord.js';

export const name = Events.ChannelUpdate;

export async function execute(oldChannel: GuildChannel, newChannel: GuildChannel) {
    if (!newChannel.guild) return;

    // TODO: Fetch configuration from database for this server (newChannel.guild.id)
    // const config = await db.getLogConfig(newChannel.guild.id);
    // if (!config || !config.log_channels || !config.log_channel_id) return;
    const mockConfig = { log_channels: true, log_channel_id: 'YOUR_LOG_CHANNEL_ID' }; // MOCK
    if (!mockConfig.log_channels || !mockConfig.log_channel_id) return;

    const logChannel = newChannel.guild.channels.cache.get(mockConfig.log_channel_id) as TextChannel;
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
