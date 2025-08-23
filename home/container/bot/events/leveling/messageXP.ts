
import { Events, Message, Collection } from 'discord.js';
import { getServerConfig, updateUserXP } from '@/lib/db';

const userCooldowns = new Collection<string, number>();

export const name = Events.MessageCreate;

export async function execute(message: Message) {
    if (!message.guild || message.author.bot) return;

    const config = await getServerConfig(message.guild.id, 'leveling');
    if (!config?.enabled) return;

    const cooldownKey = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    const cooldownTime = (config.cooldown_seconds || 60) * 1000;

    if (userCooldowns.has(cooldownKey)) {
        const expirationTime = userCooldowns.get(cooldownKey) as number;
        if (now < expirationTime) {
            return; // User is on cooldown
        }
    }

    userCooldowns.set(cooldownKey, now + cooldownTime);

    let xpToGive = config.xp_per_message || 15;

    // --- Check for channel boosts ---
    const channelBoost = config.xp_boost_channels?.find(c => c.channel_id === message.channel.id);
    if (channelBoost) {
        xpToGive *= channelBoost.multiplier;
    }

    // --- Check for role boosts ---
    const memberRoles = message.member?.roles.cache.map(r => r.id) || [];
    let highestRoleMultiplier = 1;
    config.xp_boost_roles?.forEach(boost => {
        if (memberRoles.includes(boost.role_id) && boost.multiplier > highestRoleMultiplier) {
            highestRoleMultiplier = boost.multiplier;
        }
    });
    xpToGive *= highestRoleMultiplier;

    updateUserXP(message.author.id, message.guild.id, Math.round(xpToGive));
}
