
import { Guild, User } from 'discord.js';
import { getServerConfig } from '@/lib/db';

export async function handleLevelUp(user: User, guild: Guild, newLevel: number) {
    const config = await getServerConfig(guild.id, 'leveling');
    if (!config || !config.enabled) return;

    // --- Send level up message ---
    if (config.level_up_channel_id && config.level_up_message) {
        const channel = await guild.channels.fetch(config.level_up_channel_id).catch(() => null);
        if (channel && channel.isTextBased()) {
            const message = config.level_up_message
                .replace('{user}', user.toString())
                .replace('{level}', newLevel.toString());
            try {
                await channel.send(message);
            } catch (error) {
                console.error(`[LevelUp] Could not send level up message to ${channel.id} in ${guild.name}`);
            }
        }
    }

    // --- Assign role rewards ---
    const roleReward = config.role_rewards?.find(rr => rr.level === newLevel);
    if (roleReward && roleReward.role_id) {
        try {
            const role = await guild.roles.fetch(roleReward.role_id);
            const member = await guild.members.fetch(user.id);
            if (role && member) {
                await member.roles.add(role);
                console.log(`[LevelUp] Assigned role ${role.name} to ${user.tag} for reaching level ${newLevel}.`);
            }
        } catch (error) {
            console.error(`[LevelUp] Could not assign role reward for level ${newLevel} to ${user.tag}:`, error);
        }
    }
}
