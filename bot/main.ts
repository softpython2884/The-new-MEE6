

import { Client, GatewayIntentBits, Events, ActivityType, Collection, PermissionFlagsBits, MessageFlags, ChannelType, OverwriteType } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { loadCommands } from './handlers/commandHandler';
import type { Command } from '../src/types';
import { initializeDatabase, syncGuilds, getServerConfig } from '../src/lib/db';
import { startApi } from './api';
import { initializeBotAuth } from './auth';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });


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
    
    if (interaction.isButton()) {
        console.log(`[Interaction] Button clicked: ${interaction.customId}`);
        if (interaction.customId === 'create_private_room') {
            if (!interaction.guild || !interaction.member) return;
            const config = getServerConfig(interaction.guild.id, 'private-rooms');
            if (!config || !config.enabled || !config.category_id) {
                await interaction.reply({ content: "Le système de salons privés n'est pas correctement configuré.", flags: MessageFlags.Ephemeral });
                return;
            }

            try {
                await interaction.deferReply({ ephemeral: true });

                const channelName = `ticket-${interaction.user.username}`;
                const existingChannel = interaction.guild.channels.cache.find(c => c.name === channelName && c.parentId === config.category_id);
                if(existingChannel) {
                    await interaction.editReply(`Vous avez déjà un salon privé ouvert : ${existingChannel}`);
                    return;
                }

                const channel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: config.category_id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, // @everyone
                            deny: [PermissionFlagsBits.ViewChannel],
                            type: OverwriteType.Role
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                            type: OverwriteType.Member
                        },
                         {
                            id: client.user!.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                            type: OverwriteType.Member
                        },
                    ],
                });

                await channel.send(`Bienvenue ${interaction.user}, votre salon privé a été créé. Décrivez votre problème ici.`);
                await interaction.editReply(`Votre salon privé a été créé : ${channel}`);

            } catch (error) {
                console.error('[PrivateRoom] Error creating channel:', error);
                await interaction.editReply({ content: 'Une erreur est survenue lors de la création du salon.' });
            }
        }
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
            await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
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
