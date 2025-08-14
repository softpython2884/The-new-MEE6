
import { Events, Guild } from 'discord.js';
import { setupDefaultConfigs } from '../../../src/lib/db';

/**
 * This event handler is triggered whenever the bot joins a new guild.
 * It ensures that the new guild is immediately set up with all the
 * default configurations for every module, making it ready to use
 * without requiring a bot restart.
 */
export const name = Events.GuildCreate;

export async function execute(guild: Guild) {
    console.log(`[+] Joined a new guild: ${guild.name} (${guild.id}).`);
    console.log(`[Database] Setting up default configurations for ${guild.name}...`);
    
    try {
        await setupDefaultConfigs(guild.id);
        console.log(`[Database] Successfully set up default configurations for ${guild.name}.`);
    } catch (error) {
        console.error(`[Database] Failed to set up default configurations for guild ${guild.id}:`, error);
    }
}
