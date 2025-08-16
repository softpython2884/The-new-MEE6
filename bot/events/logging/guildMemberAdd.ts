

import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
    const config = await getServerConfig(member.guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.members?.enabled) return;
    
    // Check for exemptions
    if (member.roles.cache.some(r => config.exempt_roles?.includes(r.id))) return;

    const targetChannelId = config.log_settings.members.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await member.guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0x57F287) // Discord Green
        .setAuthor({ name: `${member.user.tag} a rejoint`, iconURL: member.user.displayAvatarURL() })
        .setDescription(`${member.user} a rejoint le serveur.`)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
            { name: 'Nom d\'utilisateur', value: member.user.username, inline: true },
            { name: 'Mention', value: `<@${member.user.id}>`, inline: true },
            { name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:f>`, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${member.user.id}` });

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log d'arrivée de membre pour le serveur ${member.guild.id}:`, error);
    }
}
