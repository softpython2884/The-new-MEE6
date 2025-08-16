

import { Events, VoiceState, PermissionFlagsBits } from 'discord.js';
import { getServerConfig } from '@/lib/db';


export const name = Events.VoiceStateUpdate;

export async function execute(oldState: VoiceState, newState: VoiceState) {
    // We are only interested in when a user connects to a new voice channel
    if (oldState.channelId === newState.channelId) {
        return;
    }

    // User disconnected from a voice channel, nothing to do.
    if (!newState.channel || !newState.member) {
        return;
    }
    
    // Ignore bots
    if (newState.member.user.bot) {
        return;
    }

    const webcamConfig = await getServerConfig(newState.guild.id, 'webcam');

    if (!webcamConfig?.enabled) {
        return;
    }

    // Check if the member has an exempt role
    const exemptRoles = webcamConfig.exempt_roles || [];
    const memberRoles = newState.member.roles.cache.map(role => role.id);
    const isExempt = memberRoles.some(roleId => exemptRoles.includes(roleId));

    if (isExempt) {
        console.log(`[Webcam Control] User ${newState.member.user.tag} is exempt. No action taken.`);
        return;
    }
    
    console.log(`[Webcam Control] Applying policy '${webcamConfig.mode}' for user ${newState.member.user.tag} in channel ${newState.channel.name}`);

    try {
        switch (webcamConfig.mode) {
            case 'allowed':
                // Clear any existing overwrites by the bot for this user in this channel
                const existingOverwrite = newState.channel.permissionOverwrites.cache.get(newState.member.id);
                if (existingOverwrite) {
                    await existingOverwrite.delete().catch(e => console.error(`[Webcam Control] Failed to clear old permissions for ${newState.member?.user.tag}:`, e));
                }
                break;
            case 'video_allowed':
                // Allow video/stream
                await newState.channel.permissionOverwrites.edit(newState.member.id, {
                    [PermissionFlagsBits.Stream]: true,
                });
                break;
            case 'disallowed':
                // Deny both
                await newState.channel.permissionOverwrites.edit(newState.member.id, {
                    [PermissionFlagsBits.Stream]: false,
                });
                break;
        }
    } catch (error) {
        console.error(`[Webcam Control] Failed to apply permissions for ${newState.member.user.tag}:`, error);
        // This can happen if the bot doesn't have Manage Roles/Channels permission
    }
}
