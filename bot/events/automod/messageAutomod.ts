

import { Events, Message, TextChannel } from 'discord.js';
import { getServerConfig } from '@/lib/db';

export const name = Events.MessageCreate;

export async function execute(message: Message) {
    if (!message.guild || message.author.bot || !message.member) return;

    const config = await getServerConfig(message.guild.id, 'auto-moderation');
    if (!config?.enabled || !config.rules || config.rules.length === 0) {
        return;
    }

    const memberRoles = message.member.roles.cache.map(r => r.id);
    const channelId = message.channel.id;

    for (const rule of config.rules) {
        // Check for exemptions
        const isRoleExempt = rule.exempt_roles.some((roleId: string) => memberRoles.includes(roleId));
        if (isRoleExempt) continue;

        const isChannelExempt = rule.exempt_channels.includes(channelId);
        if (isChannelExempt) continue;

        // Check for keyword matches
        const hasKeyword = rule.keywords.some((keyword: string) => message.content.toLowerCase().includes(keyword.toLowerCase()));

        if (hasKeyword) {
            console.log(`[AutoMod] Message de ${message.author.tag} déclenché la règle "${rule.name}"`);

            try {
                // Perform action
                if (rule.action === 'delete') {
                    await message.delete();
                }

                // Send warning/log
                const logChannelId = config.log_channel_id || message.channel.id;
                const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null) as TextChannel;
                
                if (logChannel) {
                    await logChannel.send(`> **Auto-Modération :** Le message de ${message.author.toString()} a été supprimé car il contenait un terme interdit par la règle "${rule.name}".`);
                }

            } catch (error) {
                console.error(`[AutoMod] Erreur lors de l'action pour la règle "${rule.name}":`, error);
            }
            
            // Stop processing further rules once one has been triggered
            return;
        }
    }
}
