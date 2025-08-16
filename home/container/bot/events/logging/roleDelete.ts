import { Events, Role, EmbedBuilder, TextChannel, AuditLogEvent } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.RoleDelete;

export async function execute(role: Role) {
    const config = await getServerConfig(role.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.roles?.enabled) return;

    const targetChannelId = config.log_settings.roles.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await role.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0xED4245) // Discord Red
        .setTitle('Rôle Supprimé')
        .setDescription(`Le rôle **@${role.name}** a été supprimé.`)
        .setTimestamp()
        .setFooter({ text: `ID: ${role.id}` });
    
    // Find who deleted the role
    try {
        const fetchedLogs = await role.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.RoleDelete,
        });

        const roleLog = fetchedLogs.entries.find(entry => (entry.target as Role).id === role.id);
        if (roleLog) {
            const { executor } = roleLog;
            embed.addFields({ name: 'Supprimé par', value: executor?.toString() || 'Inconnu', inline: true });
        }
    } catch(e) {
        console.warn(`[Log] Missing permissions to fetch audit logs for role deletion on ${role.guild.name}`);
    }


    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de suppression de rôle pour le serveur ${role.guild.id}:`, error);
    }
}
