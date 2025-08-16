
import { Events, VoiceState, ActivityType, Collection, ChannelType, GuildChannel } from 'discord.js';
import { smartVoiceFlow } from '../../../src/ai/flows/smart-voice-flow';
import { getServerConfig } from '../../../src/lib/db';
import type { InteractiveChannel } from '../../../src/types';


// Simple cache to prevent spamming the API for the same channel within a short time
const channelUpdateCache = new Collection<string, number>();
const UPDATE_COOLDOWN = 60000; // 1 minute (60,000 ms)

async function updateChannel(channel: GuildChannel) {
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
        } else if (memberCount === 0 && channel.name !== "Vocal intéractif") {
            // This is a direct check to ensure an empty channel gets reset if the AI fails to provide the name
             await (channel as GuildChannel).setName("Vocal intéractif");
        }
        else {
            console.log(`[Smart-Voice] AI proposed the same name or an empty name. No change made for channel ${channel.id}.`);
        }

    } catch (error) {
        console.error(`[Smart-Voice] Error during smart voice flow for channel ${channel.id}:`, error);
    }
}


export const name = Events.VoiceStateUpdate;

export async function execute(oldState: VoiceState, newState: VoiceState) {
    // A user joined a channel or switched from another one
    if (newState.channel && newState.channel.type === ChannelType.GuildVoice && newState.channelId !== oldState.channelId) {
        await updateChannel(newState.channel as GuildChannel);
    }

    // A user left a channel
    if (oldState.channel && oldState.channel.type === ChannelType.GuildVoice && oldState.channelId !== newState.channelId) {
        // We also need to update the old channel to reflect the change in member count/activities
        await updateChannel(oldState.channel as GuildChannel);
    }

     // A user's presence (activity) updated, but they didn't change channels
    if (newState.channel && newState.channelId === oldState.channelId && newState.member) {
         // This logic could be tied to a PresenceUpdate event handler for better accuracy
         // For simplicity, we'll re-evaluate on any voice state change.
        await updateChannel(newState.channel as GuildChannel);
    }
}
