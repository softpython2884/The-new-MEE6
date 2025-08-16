

import { Events, GuildChannel, TextChannel, EmbedBuilder, ChannelType, PermissionOverwrites, Collection, Role, GuildMember } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';
import { diff } from 'deep-object-diff';

export const name = Events.ChannelUpdate;

// Helper function to format permission changes
function formatPermissionChanges(oldPerms: PermissionOverwrites, newPerms: PermissionOverwrites): string[] {
    const changes: string[] = [];
    const changedFor = (oldPerms.type === 0 ? 'Rôle' : 'Membre');
    const targetName = oldPerms.type === 0 
        ? oldPerms.channel.guild.roles.cache.get(oldPerms.id)?.name 
        : oldPerms.channel.guild.members.cache.get(oldPerms.id)?.displayName;
    
    if(!targetName) return [];

    const oldBits = { allow: oldPerms.allow.bitfield, deny: oldPerms.deny.bitfield };
    const newBits = { allow: newPerms.allow.bitfield, deny: newPerms.deny.bitfield };
    
    const diffs = diff(oldBits, newBits);
    
    if (Object.keys(diffs).length > 0) {
        changes.push(`**${changedFor} : @${targetName}**`);
        if (diffs.allow) changes.push(`> Permissions autorisées modifiées.`);
        if (diffs.deny) changes.push(`> Permissions refusées modifiées.`);
    }

    return changes;
}

export async function execute(oldChannel: GuildChannel, newChannel: GuildChannel) {
    if (!newChannel.guild) return;

    const config = await getServerConfig(newChannel.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.channels?.enabled) return;
    
    const targetChannelId = config.log_settings.channels.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await newChannel.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0x00BFFF) // DeepSkyBlue
        .setTitle('Salon Mis à Jour')
        .setTimestamp()
        .setFooter({ text: `ID: ${newChannel.id}` });

    let hasChanged = false;

    // Name change
    if (oldChannel.name !== newChannel.name) {
        embed.addFields({ name: 'Nom du Salon', value: `\`${oldChannel.name}\` ➔ \`${newChannel.name}\``, inline: false });
        hasChanged = true;
    } else {
         embed.setDescription(`Le salon <#${newChannel.id}> a été mis à jour.`);
    }

    // Topic change for text channels
    if (oldChannel.type === ChannelType.GuildText && newChannel.type === ChannelType.GuildText) {
        if (oldChannel.topic !== newChannel.topic) {
             embed.addFields({ name: 'Sujet du Salon (Topic)', value: `Modifié`, inline: false });
             hasChanged = true;
        }
    }

    // Permission overwrites change
    const oldPerms = oldChannel.permissionOverwrites.cache;
    const newPerms = newChannel.permissionOverwrites.cache;
    if (oldPerms.size !== newPerms.size || !oldPerms.every((p, id) => newPerms.has(id) && newPerms.get(id)!.allow.bitfield === p.allow.bitfield && newPerms.get(id)!.deny.bitfield === p.deny.bitfield)) {
         embed.addFields({ name: 'Permissions Mises à Jour', value: `Les permissions du salon ont été modifiées.`, inline: false });
         hasChanged = true;
    }
    
    if (!hasChanged) {
        return; // No detectable change worth logging
    }

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de mise à jour de salon pour le serveur ${newChannel.guild.id}:`, error);
    }
}
