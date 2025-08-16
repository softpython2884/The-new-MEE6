
import { Events, Message, PartialMessage, EmbedBuilder, TextChannel, AuditLogEvent, User } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.MessageDelete;

export async function execute(message: Message | PartialMessage) {
    if (!message.guild) return;

    const config = await getServerConfig(message.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.messages?.enabled) return;
    
    // Check for exemptions
    if (message.author?.id && (message.member?.roles.cache.some(r => config.exempt_roles?.includes(r.id)))) return;
    if (config.exempt_channels?.includes(message.channel.id)) return;

    const targetChannelId = config.log_settings.messages.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await message.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel || logChannel.id === message.channel.id) return;

    const embed = new EmbedBuilder()
        .setColor(0xFF470F) // Orange
        .setTitle('Message Supprimé')
        .setDescription(`Un message de **${message.author?.tag || 'Auteur inconnu'}** a été supprimé dans <#${message.channel.id}>.`)
        .addFields(
            { name: 'Contenu', value: message.content ? `\`\`\`${message.content.substring(0, 1020)}\`\`\`` : 'Impossible de récupérer le contenu (embed ou message partiel).', inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `Auteur ID: ${message.author?.id ?? 'Inconnu'} | Message ID: ${message.id}` });
        
    // --- Find who deleted the message ---
    try {
        const fetchedLogs = await message.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MessageDelete,
        });

        const deletionLog = fetchedLogs.entries.first();

        if (deletionLog) {
            const { executor, target } = deletionLog;

            // Check if the log entry is for the deleted message
            if (target.id === message.author?.id) {
                embed.addFields({ name: 'Supprimé par', value: executor?.tag || 'Inconnu', inline: true });
            } else {
                 embed.addFields({ name: 'Supprimé par', value: 'L\'auteur lui-même (ou non-journalisé).', inline: true });
            }
        }
    } catch (error) {
        console.warn(`[Log] N'a pas pu vérifier les logs d'audit pour la suppression de message sur le serveur ${message.guild.id}. Permissions manquantes ?`);
        embed.addFields({ name: 'Supprimé par', value: 'Inconnu (permissions de log manquantes).', inline: true });
    }


    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de suppression de message pour le serveur ${message.guild.id}:`, error);
    }
}
