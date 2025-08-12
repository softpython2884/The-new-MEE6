import { Events, Message, PartialMessage, EmbedBuilder, TextChannel } from 'discord.js';

export const name = Events.MessageUpdate;

export async function execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (newMessage.author?.bot || !newMessage.guild || oldMessage.content === newMessage.content) return;
    
    // TODO: Fetch configuration from database for this server (newMessage.guild.id)
    // const config = await db.getLogConfig(newMessage.guild.id);
    // if (!config || !config.log_messages || !config.log_channel_id) return;
    const mockConfig = { log_messages: true, log_channel_id: 'YOUR_LOG_CHANNEL_ID' }; // MOCK
    if (!mockConfig.log_messages || !mockConfig.log_channel_id) return;

    const logChannel = newMessage.guild.channels.cache.get(mockConfig.log_channel_id) as TextChannel;
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
