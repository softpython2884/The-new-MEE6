
import { Client, GatewayIntentBits, Events, ActivityType, Collection, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { loadCommands } from './handlers/commandHandler';
import type { Command } from '@/types';
import { syncGuilds, initializeDatabase } from '@/lib/db';
import { startApi } from './api';
import { initializeBotAuth } from './auth';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });


// --- Initialize Database First ---
// This is critical to ensure all tables exist before any other code tries to access them.
initializeDatabase();
// ---------------------------------

console.log('Bot is starting...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
    ]
});

// Extend the client object to hold our commands
declare module "discord.js" {
    export interface Client {
        commands: Collection<string, Command>;
    }
}

client.commands = new Collection<string, Command>();

// Load Event Handlers
const loadEvents = (client: Client) => {
    const eventsPath = path.join(__dirname, 'events');
    const traverseDirectory = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                traverseDirectory(fullPath);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const event = require(fullPath);
                if (event.name && event.execute) {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }
                    console.log(`[+] Loaded event: ${event.name} from ${path.relative(eventsPath, fullPath)}`);
                } else {
                    console.log(`[-] Failed to load event at ${fullPath}. Missing "name" or "execute" property.`);
                }
            }
        }
    };
    traverseDirectory(eventsPath);
};

loadEvents(client);


client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    
    // Set the bot's presence
    readyClient.user.setActivity('Marcustacée', { type: ActivityType.Playing });
    
    // Sync guilds with the database
    await syncGuilds(readyClient);

    // --- User's Requested Logging ---
    console.log("--- Bot Server & Admin Report ---");
    for (const guild of readyClient.guilds.cache.values()) {
        console.log(`[Server] ${guild.name} (${guild.id})`);
        try {
            const members = await guild.members.fetch();
            const admins = members.filter(member => member.permissions.has(PermissionFlagsBits.Administrator));
            if (admins.size > 0) {
                 console.log(`  [Admins] ${admins.map(admin => `${admin.user.tag} (${admin.id})`).join(', ')}`);
            } else {
                console.log("  [Admins] No members with Administrator permissions found.");
            }
        } catch (error) {
            console.log(`  [Admins] Could not fetch members for ${guild.name}:`, error);
        }
    }
    console.log("--- End Report ---");
    // ---------------------------------

    // Load and register slash commands
    await loadCommands(client);

    // Start the API for the web panel
    startApi(client);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
        return;
    }
    
    // TODO: Handle button interactions for modules like Anti-Bot and Private-Rooms
    if (interaction.isButton()) {
        console.log(`[Interaction] Button clicked: ${interaction.customId}`);
        // Example: if (interaction.customId.startsWith('approve_bot_')) { ... }
        // Example: if (interaction.customId === 'create_private_room') { ... }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});


const token = process.env.DISCORD_TOKEN;
if (!token) {
    throw new Error('DISCORD_TOKEN is not defined in your environment variables. Please create a .env.local file and add it.');
}
if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error('DISCORD_CLIENT_ID is not defined in your environment variables. Please create a .env.local file and add it.');
}
if (!process.env.DISCORD_CLIENT_SECRET) {
    throw new Error('DISCORD_CLIENT_SECRET is not defined in your environment variables. Please create a .env.local file and add it.');
}


async function startBot() {
    try {
        await initializeBotAuth();
        console.log('[Auth] Bot successfully authenticated with Discord API.');
        await client.login(token);
    } catch (error) {
        console.error('Bot failed to start:', error);
        process.exit(1);
    }
}

startBot();
