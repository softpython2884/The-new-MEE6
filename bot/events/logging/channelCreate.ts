import { Events, GuildChannel, EmbedBuilder, TextChannel } from 'discord.js';

export const name = Events.ChannelCreate;

export async function execute(channel: GuildChannel) {
    if (!channel.guild) return;

    // TODO: Fetch configuration from database for this server (channel.guild.id)
    // const config = await db.getLogConfig(channel.guild.id);
    // if (!config || !config.log_channels || !config.log_channel_id) return;
    const mockConfig = { log_channels: true, log_channel_id: 'YOUR_LOG_CHANNEL_ID' }; // MOCK
    if (!mockConfig.log_channels || !mockConfig.log_channel_id) return;

    const logChannel = channel.guild.channels.cache.get(mockConfig.log_channel_id) as TextChannel;
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
