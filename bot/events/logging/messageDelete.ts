import { Events, Message, PartialMessage, EmbedBuilder, TextChannel } from 'discord.js';

export const name = Events.MessageDelete;

export async function execute(message: Message | PartialMessage) {
    if (message.author?.bot || !message.guild) return;

    // TODO: Fetch configuration from database for this server (message.guildId)
    // const config = await db.getLogConfig(message.guildId);
    // if (!config || !config.log_messages || !config.log_channel_id) return;
    const mockConfig = { log_messages: true, log_channel_id: 'YOUR_LOG_CHANNEL_ID' }; // MOCK
    if (!mockConfig.log_messages || !mockConfig.log_channel_id) return;

    const logChannel = message.guild.channels.cache.get(mockConfig.log_channel_id) as TextChannel;
    if (!logChannel || logChannel.id === message.channel.id) return;

    const embed = new EmbedBuilder()
        .setColor(0xFF470F) // Orange
        .setTitle('Message Supprimé')
        .setDescription(`Un message de **${message.author?.tag}** a été supprimé dans <#${message.channel.id}>.`)
        .addFields(
            { name: 'Contenu', value: message.content ? `\`\`\`${message.content.substring(0, 1020)}\`\`\`` : 'Impossible de récupérer le contenu (message partiel ou embed).', inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `Auteur ID: ${message.author?.id} | Message ID: ${message.id}` });

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de suppression de message pour le serveur ${message.guild.id}:`, error);
    }
}
