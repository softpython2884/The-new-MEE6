

import { Events, VoiceState } from 'discord.js';
import { getServerConfig } from '@/lib/db';

export const name = Events.VoiceStateUpdate;

async function handleVoiceState(newState: VoiceState) {
    if (!newState.member || !newState.guild || newState.member.user.bot) {
        return;
    }

    const config = await getServerConfig(newState.guild.id, 'webcam');
    if (!config?.enabled) {
        return;
    }

    // Check if the member is exempt
    const isExempt = (config.exempt_roles || []).some((roleId: string) => newState.member!.roles.cache.has(roleId));
    if (isExempt) {
        return;
    }

    let needsCorrection = false;
    let reason = '';

    // Check webcam status
    if (newState.selfVideo && !config.webcam_allowed) {
        needsCorrection = true;
        reason = 'Utilisation de la webcam non autorisée.';
    }

    // Check stream status
    if (newState.streaming && !config.stream_allowed) {
        needsCorrection = true;
        reason = 'Partage d\'écran non autorisé.';
    }

    if (needsCorrection) {
        console.log(`[Webcam Control] Correction attempt for ${newState.member.user.tag}: ${reason}`);
        try {
            // Attempt to turn off video by setting their stream to null.
            // This is an indirect way and might not always work depending on Discord client behavior.
            await newState.member.voice.setSelfVideo(false);

            // A more direct approach would be to manage permissions, but that's less reactive.
            // The most reliable action is disconnecting them if they don't comply.
            
            // For now, the most reliable action is disconnecting.
            await newState.member.voice.disconnect(reason);

            // You could also try to send a DM to the user
             try {
                await newState.member.send(`Votre vidéo ou stream sur le serveur "${newState.guild.name}" a été coupé car il n'est pas autorisé.`);
            } catch (dmError) {
                console.warn(`[Webcam Control] Could not send DM to ${newState.member.user.tag}.`);
            }

        } catch (error) {
            console.error(`[Webcam Control] Failed to take action on ${newState.member.user.tag}:`, error);
        }
    }
}

export async function execute(oldState: VoiceState, newState: VoiceState) {
    // This will trigger on any voice state change: join, leave, mute, deafen, stream, video
    await handleVoiceState(newState);
}
