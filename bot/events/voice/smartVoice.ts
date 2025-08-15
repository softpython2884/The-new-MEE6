
import { Events, VoiceState, ActivityType, Collection, ChannelType, GuildChannel } from 'discord.js';
import { smartVoiceFlow } from '../../../src/ai/flows/smart-voice-flow';
import { getServerConfig } from '../../../src/lib/db';
import type { InteractiveChannel } from '../../../src/types';


// Simple cache to prevent spamming the API for the same channel within a short time
const channelUpdateCache = new Collection<string, number>();
const UPDATE_COOLDOWN = 60000; // 1 minute (60,000 ms)

export const name = Events.VoiceStateUpdate;

export async function execute(oldState: VoiceState, newState: VoiceState) {
    const channel = newState.channel || oldState.channel;

    // We only care about voice channels and actual users.
    if (!channel || !newState.guild || channel.type !== ChannelType.GuildVoice || newState.member?.user.bot) {
        return;
    }
    
    // --- Check if the channel is an interactive channel ---
    const smartVoiceConfig = await getServerConfig(newState.guild.id, 'smart-voice');
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
        return;
    }
    
    try {
        const members = channel.members.filter(m => !m.user.bot);
        const memberCount = members.size;
        
        const activities = members
            .map(member => member.presence?.activities.find(activity => activity.type === ActivityType.Playing)?.name)
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
