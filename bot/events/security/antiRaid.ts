

import { Events, GuildMember, Collection, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '@/lib/db';

// --- Anti-Raid Cache ---
// Maps a guild ID to a collection of member join timestamps
const guildJoinsCache = new Collection<string, number[]>();

const sensitivityThresholds = {
    low: [20, 15],
    medium: [10, 10],
    high: [5, 5],
};

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
    const antiRaidConfig = await getServerConfig(member.guild.id, 'adaptive-anti-raid');

    if (!antiRaidConfig?.enabled || !antiRaidConfig.raid_detection_enabled) {
        return;
    }

    const now = Date.now();
    const joins = guildJoinsCache.get(member.guild.id) || [];
    
    const sensitivity = antiRaidConfig.raid_sensitivity as 'low' | 'medium' | 'high';
    const [joinThreshold, timeframeSeconds] = sensitivityThresholds[sensitivity];
    const timeframeMs = timeframeSeconds * 1000;

    // Filter out old join timestamps
    const recentJoins = joins.filter(timestamp => now - timestamp < timeframeMs);
    recentJoins.push(now);
    guildJoinsCache.set(member.guild.id, recentJoins);

    if (recentJoins.length >= joinThreshold) {
        // --- RAID DETECTED ---
        console.log(`[Anti-Raid] Raid detected on server ${member.guild.name}. ${recentJoins.length} joins in under ${timeframeSeconds} seconds.`);
        
        // Prevent this from firing multiple times for the same raid wave
        guildJoinsCache.delete(member.guild.id); 

        // Send alert
        if (antiRaidConfig.alert_channel_id) {
            const alertChannel = await member.guild.channels.fetch(antiRaidConfig.alert_channel_id as string).catch(() => null) as TextChannel;
            if (alertChannel) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🚨 Alerte Anti-Raid 🚨')
                    .setDescription(`Un raid potentiel a été détecté sur le serveur.`)
                    .addFields(
                        { name: 'Membres ayant rejoint', value: `${recentJoins.length}`, inline: true },
                        { name: 'Fenêtre de temps', value: `${timeframeSeconds} secondes`, inline: true },
                        { name: 'Action entreprise', value: `\`${antiRaidConfig.raid_action}\``, inline: true }
                    )
                    .setTimestamp();
                await alertChannel.send({ embeds: [embed] });
            }
        }

        // Take action
        switch (antiRaidConfig.raid_action) {
            case 'lockdown':
                // TODO: Implement server lockdown logic. This is complex.
                // It might involve changing permissions for @everyone on all channels,
                // or setting a flag in the database that the bot checks on every message.
                console.log(`[Anti-Raid] Server lockdown action is not yet implemented.`);
                break;
            case 'kick':
                // TODO: Implement kicking logic.
                // Kick all users who joined during the raid timeframe.
                console.log(`[Anti-Raid] Kick action is not yet implemented.`);
                break;
            case 'ban':
                // TODO: Implement banning logic.
                // Ban all users who joined during the raid timeframe.
                console.log(`[Anti-Raid] Ban action is not yet implemented.`);
                break;
        }
    }
}
