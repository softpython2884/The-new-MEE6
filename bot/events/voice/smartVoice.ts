

import { Events, VoiceState, ActivityType, Collection } from 'discord.js';
import { smartVoiceFlow } from '@/ai/flows/smart-voice-flow';
import { getServerConfig } from '@/lib/db';
import type { InteractiveChannel } from '@/types';


// Simple cache to prevent spamming the API for the same channel within a short time
const channelUpdateCache = new Collection<string, number>();
const UPDATE_COOLDOWN = 60000; // 1 minute

export const name = Events.VoiceStateUpdate;

export async function execute(oldState: VoiceState, newState: VoiceState) {
    // Determine the relevant channel and if it's a join/leave event
    const channel = newState.channel || oldState.channel;
    if (!channel || !newState.guild) return;

    const smartVoiceConfig = await getServerConfig(newState.guild.id, 'smart-voice');

    // Check if the module is enabled and if the affected channel is one of our "smart" channels
    const interactiveChannels = (smartVoiceConfig?.interactive_channels as InteractiveChannel[]) || [];
    const interactiveChannelInfo = interactiveChannels.find(c => c.id === channel.id);
    
    if (!smartVoiceConfig?.enabled || !interactiveChannelInfo) {
        return;
    }

    // Check if the channel is on cooldown
    const lastUpdate = channelUpdateCache.get(channel.id);
    if (lastUpdate && Date.now() - lastUpdate < UPDATE_COOLDOWN) {
        return;
    }

    // Get current members and their activities in the channel
    const members = channel.members;
    if (members.size === 0) {
        // TODO: Reset channel name and topic to default if empty
        return;
    }

    const activities = members
        .map(member => member.presence?.activities.find(activity => activity.type === ActivityType.Playing)?.name)
        .filter((game): game is string => !!game);
    
    console.log(`[Smart-Voice] Updating channel ${channel.name}. Theme: ${interactiveChannelInfo.theme}, Activities: ${activities.join(', ')}`);

    try {
        const result = await smartVoiceFlow({
            theme: interactiveChannelInfo.theme,
            activities: activities,
        });

        if (result.channelName && result.channelTopic) {
            await channel.setName(result.channelName);
            await channel.setTopic(result.channelTopic);
            
            console.log(`[Smart-Voice] Renamed channel ${channel.id} to "${result.channelName}"`);
            
            // Update cache to prevent spam
            channelUpdateCache.set(channel.id, Date.now());
        }

    } catch (error) {
        console.error('[Smart-Voice] Error during smart voice flow:', error);
    }
}
