
import { Events, Collection, Message, PartialMessage, EmbedBuilder, TextChannel, Snowflake, AuditLogEvent } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.MessageDeleteBulk;

export async function execute(messages: Collection<Snowflake, Message | PartialMessage>, channel: TextChannel) {
    if (!channel.guild) return;

    const config = await getServerConfig(channel.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.messages?.enabled) return;
    
    // Check for exemptions
    if (config.exempt_channels?.includes(channel.id)) return;

    const targetChannelId = config.log_settings.messages.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await channel.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel || logChannel.id === channel.id) return;

    const embed = new EmbedBuilder()
        .setColor(0x992D22) // Dark Red
        .setTitle('Suppression de Messages en Masse')
        .setDescription(`**${messages.size}** messages ont été supprimés dans le salon ${channel.toString()}.`)
        .setTimestamp();
        
    try {
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MessageBulkDelete,
        });

        const bulkDeleteLog = fetchedLogs.entries.first();

        if (bulkDeleteLog) {
            const { executor } = bulkDeleteLog;
            embed.addFields({ name: 'Action effectuée par', value: executor?.tag || 'Inconnu', inline: true });
        }
    } catch (error) {
        console.warn(`[Log] N'a pas pu vérifier les logs d'audit pour la suppression en masse sur le serveur ${channel.guild.id}.`);
    }

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de suppression en masse pour le serveur ${channel.guild.id}:`, error);
    }
}
