import { Events, Role, EmbedBuilder, TextChannel, AuditLogEvent, PermissionsBitField } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.RoleUpdate;

export async function execute(oldRole: Role, newRole: Role) {
    const config = await getServerConfig(newRole.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.roles?.enabled) return;

    const targetChannelId = config.log_settings.roles.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await newRole.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0x00BFFF) // DeepSkyBlue
        .setTitle('Rôle Mis à Jour')
        .setDescription(`Le rôle ${newRole} a été mis à jour.`)
        .setTimestamp()
        .setFooter({ text: `ID: ${newRole.id}` });
    
    let hasChanged = false;

    // Name change
    if (oldRole.name !== newRole.name) {
        embed.addFields({ name: 'Changement de Nom', value: `\`${oldRole.name}\` ➔ \`${newRole.name}\``});
        hasChanged = true;
    }

    // Color change
    if (oldRole.hexColor !== newRole.hexColor) {
        embed.addFields({ name: 'Changement de Couleur', value: `\`${oldRole.hexColor}\` ➔ \`${newRole.hexColor}\``});
        hasChanged = true;
    }

    // Hoist change
    if (oldRole.hoist !== newRole.hoist) {
        embed.addFields({ name: 'Affichage séparé', value: newRole.hoist ? 'Activé' : 'Désactivé' });
        hasChanged = true;
    }

    // Mentionable change
    if (oldRole.mentionable !== newRole.mentionable) {
        embed.addFields({ name: 'Mentionnable', value: newRole.mentionable ? 'Oui' : 'Non' });
        hasChanged = true;
    }

    // Permissions change
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        const oldPerms = new PermissionsBitField(oldRole.permissions.bitfield);
        const newPerms = new PermissionsBitField(newRole.permissions.bitfield);
        const addedPerms = newPerms.toArray().filter(p => !oldPerms.has(p));
        const removedPerms = oldPerms.toArray().filter(p => !newPerms.has(p));
        
        if (addedPerms.length > 0) {
            embed.addFields({ name: 'Permissions ajoutées', value: `\`\`\`diff\n+ ${addedPerms.join('\n+ ')}\n\`\`\`` });
        }
        if (removedPerms.length > 0) {
            embed.addFields({ name: 'Permissions retirées', value: `\`\`\`diff\n- ${removedPerms.join('\n- ')}\n\`\`\`` });
        }
        hasChanged = true;
    }


    if (!hasChanged) return; // No change worth logging

    // Find who updated the role
    try {
        const fetchedLogs = await newRole.guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.RoleUpdate,
        });

        const roleLog = fetchedLogs.entries.find(entry => (entry.target as Role).id === newRole.id);
        if (roleLog) {
            embed.addFields({ name: 'Modifié par', value: roleLog.executor?.toString() || 'Inconnu' });
        }
    } catch(e) {
        console.warn(`[Log] Missing permissions to fetch audit logs for role update on ${newRole.guild.name}`);
    }


    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de mise à jour de rôle pour le serveur ${newRole.guild.id}:`, error);
    }
}
