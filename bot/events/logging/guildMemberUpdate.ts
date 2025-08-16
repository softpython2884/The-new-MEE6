
'use server';

import { Events, GuildMember, EmbedBuilder, TextChannel, Role } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.GuildMemberUpdate;

export async function execute(oldMember: GuildMember, newMember: GuildMember) {
    if (!newMember.guild) return;

    const config = await getServerConfig(newMember.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.members?.enabled) return;
    
    // Check for exemptions
    if (newMember.roles.cache.some(r => config.exempt_roles?.includes(r.id))) return;

    const targetChannelId = config.log_settings.members.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await newMember.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const auditLogs = await newMember.guild.fetchAuditLogs({ limit: 1 });
    const log = auditLogs.entries.first();
    const executor = log?.executor;

    // Nickname Change
    if (oldMember.nickname !== newMember.nickname) {
        const embed = new EmbedBuilder()
            .setColor(0x3498DB) // Blue
            .setAuthor({ name: newMember.user.tag, iconURL: newMember.displayAvatarURL() })
            .setTitle('Changement de Pseudo')
            .addFields(
                { name: 'Ancien Pseudo', value: oldMember.nickname || '`Aucun`', inline: true },
                { name: 'Nouveau Pseudo', value: newMember.nickname || '`Aucun`', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `ID: ${newMember.id}` });
            
        if (executor && log?.target?.id === newMember.id && log?.action === 24) { // GuildMemberUpdate action
            embed.addFields({ name: 'Modifié par', value: executor.toString() });
        }
        
        await logChannel.send({ embeds: [embed] });
    }

    // Role Change
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    if (oldRoles.size > newRoles.size) { // Role removed
        const removedRole = oldRoles.find(role => !newRoles.has(role.id)) as Role;
        const embed = new EmbedBuilder()
            .setColor(0xE67E22) // Orange
            .setAuthor({ name: newMember.user.tag, iconURL: newMember.displayAvatarURL() })
            .setDescription(`**${newMember.user.toString()} a perdu le rôle ${removedRole.toString()}**`)
            .setTimestamp()
            .setFooter({ text: `ID: ${newMember.id}` });

        if (executor && log?.target?.id === newMember.id && log?.action === 25) { // GuildMemberRoleUpdate
             embed.addFields({ name: 'Action effectuée par', value: executor.toString() });
        }

        await logChannel.send({ embeds: [embed] });

    } else if (oldRoles.size < newRoles.size) { // Role added
        const addedRole = newRoles.find(role => !oldRoles.has(role.id)) as Role;
        const embed = new EmbedBuilder()
            .setColor(0x2ECC71) // Green
            .setAuthor({ name: newMember.user.tag, iconURL: newMember.displayAvatarURL() })
            .setDescription(`**${newMember.user.toString()} a reçu le rôle ${addedRole.toString()}**`)
            .setTimestamp()
            .setFooter({ text: `ID: ${newMember.id}` });
        
        if (executor && log?.target?.id === newMember.id && log?.action === 25) {
             embed.addFields({ name: 'Action effectuée par', value: executor.toString() });
        }
        
        await logChannel.send({ embeds: [embed] });
    }
}
