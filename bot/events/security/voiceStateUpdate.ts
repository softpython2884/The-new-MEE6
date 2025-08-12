

import { Events, VoiceState } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';


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

    if (!webcamConfig?.enabled || webcamConfig.mode === 'allowed') {
        return;
    }

    console.log(`[Webcam Control] Applying policy '${webcamConfig.mode}' for user ${newState.member.user.tag} in channel ${newState.channel.name}`);

    try {
        switch (webcamConfig.mode) {
            case 'webcam_only':
                // Allow video, deny stream
                await newState.channel.permissionOverwrites.edit(newState.member.id, {
                    Stream: false,
                    Video: true,
                });
                break;
            case 'stream_only':
                 // Allow stream, deny video
                await newState.channel.permissionOverwrites.edit(newState.member.id, {
                    Stream: true,
                    Video: false,
                });
                break;
            case 'disallowed':
                // Deny both
                await newState.channel.permissionOverwrites.edit(newState.member.id, {
                    Stream: false,
                    Video: false,
                });
                break;
        }
    } catch (error) {
        console.error(`[Webcam Control] Failed to apply permissions for ${newState.member.user.tag}:`, error);
        // This can happen if the bot doesn't have Manage Roles/Channels permission
    }
}
