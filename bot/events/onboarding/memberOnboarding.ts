
import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';
import ms from 'ms';


export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
    if (member.user.bot) return;

    const config = await getServerConfig(member.guild.id, 'mod-training');
    const isPremium = config?.premium || false;

    if (!config?.enabled || !config.onboarding_flow_enabled || !isPremium) {
        return;
    }

    const sendDMs = async () => {
        try {
            console.log(`[Onboarding] Starting onboarding for ${member.user.tag} in ${member.guild.name}.`);

            // Replace placeholder with the user's name
            const messageContent = config.mentor_messages.replace('{user}', member.toString());
            
            const dmChannel = await member.createDM();
            await dmChannel.send(messageContent);
            
            console.log(`[Onboarding] Sent onboarding message to ${member.user.tag}.`);

        } catch (error) {
            console.error(`[Onboarding] Could not send DM to ${member.user.tag}. They may have DMs disabled.`, error);
        }
    };


    if (config.dm_delay === 'immediate') {
        await sendDMs();
    } else if (config.dm_delay === 'delayed') {
        // This is a simple delay, for a real app a more robust scheduler (e.g. using a DB) would be better
        // in case the bot restarts.
        setTimeout(sendDMs, ms('1h')); 
    }
}
