
import { Events, VoiceState, ActivityType, Collection, ChannelType, GuildChannel, NonThreadGuildBasedChannel } from 'discord.js';
import { smartVoiceFlow } from '../../../src/ai/flows/smart-voice-flow';
import { getServerConfig } from '../../../src/lib/db';
import type { InteractiveChannel } from '../../../src/types';


// Simple cache to prevent spamming the API for the same channel within a short time
const channelUpdateCache = new Collection<string, number>();
const UPDATE_COOLDOWN = 60000; // 1 minute (60,000 ms)
const DEFAULT_CHANNEL_NAME = "Vocal intéractif";

async function updateChannelName(channel: NonThreadGuildBasedChannel) {
    if (channel.type !== ChannelType.GuildVoice) return;
    
    // --- Check if the channel is an interactive channel ---
    const smartVoiceConfig = await getServerConfig(channel.guild.id, 'smart-voice');
    const isPremium = smartVoiceConfig?.premium || false;
    const interactiveChannels = (smartVoiceConfig?.interactive_channels as InteractiveChannel[]) || [];
    const interactiveChannelInfo = interactiveChannels.find(c => c.id === channel.id);
    
    // If the module is disabled, not premium, or the channel is not interactive, do nothing.
    if (!smartVoiceConfig?.enabled || !isPremium || !interactiveChannelInfo) {
        return;
    }

    // --- Cooldown check to prevent API spam ---
    const now = Date.now();
    const lastUpdate = channelUpdateCache.get(channel.id);
    if (lastUpdate && now - lastUpdate < UPDATE_COOLDOWN) {
        // Allow rename for empty channels to reset them, bypassing cooldown
        if (channel.members.size > 0) {
            return;
        }
    }

    // --- Reset channel if empty ---
    if (channel.members.size === 0) {
        if (channel.name !== DEFAULT_CHANNEL_NAME) {
            console.log(`[Smart-Voice] Channel "${channel.name}" is empty. Resetting.`);
            await channel.setName(DEFAULT_CHANNEL_NAME);
            channelUpdateCache.delete(channel.id); // Clear cache on reset
        }
        return;
    }
    
    try {
        const members = channel.members.filter(m => !m.user.bot);
        const memberCount = members.size;
        
        const activities = members
            .map(member => {
                if (member.voice.streaming) return 'Streaming';
                if (member.voice.selfVideo) return 'Webcam on';
                return member.presence?.activities.find(activity => activity.type === ActivityType.Playing)?.name;
            })
            .filter((game): game is string => !!game);

        console.log(`[Smart-Voice] Updating channel "${channel.name}" (${channel.id}). Members: ${memberCount}, Theme: ${interactiveChannelInfo.theme}, Activities: ${activities.join(', ') || 'N/A'}`);

        const result = await smartVoiceFlow({
            currentName: channel.name,
            theme: interactiveChannelInfo.theme,
            memberCount: memberCount,
            activities: activities,
            customInstructions: smartVoiceConfig.custom_instructions
        });

        // Only rename if the new name is different and not empty
        if (result.channelName && result.channelName !== channel.name) {
            await (channel as GuildChannel).setName(result.channelName);
            console.log(`[Smart-Voice] Renamed channel ${channel.id} to "${result.channelName}". Bio: "${result.channelBio}"`);
            
            // Update cache timestamp after a successful rename
            channelUpdateCache.set(channel.id, now);
        } else {
            console.log(`[Smart-Voice] AI proposed the same name or an empty name. No change made for channel ${channel.id}.`);
        }

    } catch (error) {
        console.error(`[Smart-Voice] Error during smart voice flow for channel ${channel.id}:`, error);
    }
}


export const name = Events.VoiceStateUpdate;

export async function execute(oldState: VoiceState, newState: VoiceState) {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    // A user's state changed (e.g., streaming, camera on/off, activity change) but they stayed in the same channel.
    // This is hard to detect with VoiceStateUpdate alone, but we catch joins/leaves/switches.
    // A PresenceUpdate event handler would be needed for perfect activity tracking.

    // User joined a channel or switched from another one
    if (newChannel && newChannelId !== oldChannel?.id) {
        await updateChannelName(newChannel);
    }

    // User left a channel (and didn't join another) or switched
    if (oldChannel && oldChannel.id !== newChannel?.id) {
        await updateChannelName(oldChannel);
    }
}
