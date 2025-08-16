
import { Client, GatewayIntentBits, Events, ActivityType, Collection, PermissionFlagsBits, MessageFlags, ChannelType, OverwriteType, EmbedBuilder, TextChannel, ModalSubmitInteraction, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { loadCommands, updateGuildCommands, deployGlobalCommands } from './handlers/commandHandler';
import type { Command } from '@/types';
import { initializeDatabase, syncGuilds, getServerConfig } from '@/lib/db';
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
                // Ensure system event handlers are loaded
                if(fullPath.includes('system') && !fs.existsSync(fullPath.replace('.ts', '.js'))){
                     try {
                        const event = require(fullPath);
                         if (event.name && event.execute) {
                            client.on(event.name, (...args) => event.execute(...args, client));
                            console.log(`[+] Loaded event: ${event.name} from ${path.relative(eventsPath, fullPath)}`);
                         }
                     } catch(e) {
                        console.error('Failed to require', fullPath, e);
                     }
                } else {
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
        }
    };
    traverseDirectory(eventsPath);
};

loadEvents(client);


client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    
    // Set the bot's presence
    const panelUrl = process.env.PANEL_BASE_URL || 'http://localhost:9002';
    readyClient.user.setPresence({
        activities: [{ name: `Panel: ${panelUrl}`, type: ActivityType.Playing }],
        status: 'online',
    });
    
    // Load all command modules into the client
    loadCommands(client);
    
    // Deploy global commands (owner-only)
    await deployGlobalCommands(client);

    // Sync guilds with the database and deploy guild-specific commands
    await syncGuilds(readyClient);
    for (const guild of readyClient.guilds.cache.values()) {
        await updateGuildCommands(guild.id, client);
    }

    // Start the API for the web panel
    startApi(client);
});

async function handleSuggestionModal(interaction: ModalSubmitInteraction) {
    if (!interaction.guild) return;

    await interaction.deferReply({ ephemeral: true });
    
    const config = await getServerConfig(interaction.guild.id, 'suggestions');
    if (!config?.enabled || !config.suggestion_channel_id) {
        await interaction.editReply({ content: "Le système de suggestions est désactivé ou non configuré." });
        return;
    }

    const suggestionChannel = await interaction.guild.channels.fetch(config.suggestion_channel_id).catch(() => null) as TextChannel;
    if (!suggestionChannel) {
        await interaction.editReply({ content: "Le salon de suggestions configuré n'a pas été trouvé." });
        return;
    }

    const title = interaction.fields.getTextInputValue('suggestion_title');
    const description = interaction.fields.getTextInputValue('suggestion_description');

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Suggestion de ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle(title)
        .setDescription(description)
        .setColor(0x5865F2)
        .setTimestamp()
        .setFooter({ text: `ID Utilisateur: ${interaction.user.id}` });
        
    try {
        const message = await suggestionChannel.send({ embeds: [embed] });
        if (config.upvote_emoji) await message.react(config.upvote_emoji);
        if (config.downvote_emoji) await message.react(config.downvote_emoji);
        
        await interaction.editReply({ content: '✅ Votre suggestion a été envoyée avec succès !' });
    } catch (e) {
        console.error("Failed to send suggestion", e);
        await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'envoi de votre suggestion.' });
    }
}

async function handleBotSuggestionModal(interaction: ModalSubmitInteraction) {
    if (!interaction.guild) return;
    await interaction.deferReply({ ephemeral: true });
    
    const developerId = '556529963877138442';
    const idea = interaction.fields.getTextInputValue('suggestion_bot_idea');

    try {
        const developer = await client.users.fetch(developerId);
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('💡 Nouvelle suggestion pour Marcus !')
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() || undefined })
            .addFields(
                { name: 'Suggestion', value: idea },
                { name: 'Serveur d\'origine', value: `${interaction.guild.name} (\`${interaction.guild.id}\`)` }
            )
            .setTimestamp();
        
        await developer.send({ embeds: [embed] });
        await interaction.editReply({ content: '✅ Votre idée a bien été envoyée au développeur. Merci pour votre contribution !' });

    } catch (error) {
        console.error("Failed to send bot suggestion DM:", error);
        await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'envoi de votre idée. Le développeur a peut-être fermé ses messages privés.' });
    }
}


client.on(Events.InteractionCreate, async (interaction: Interaction) => {
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
    
    // Handle Modals
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'suggestion_modal_server') {
            await handleSuggestionModal(interaction);
        } else if (interaction.customId === 'suggestion_modal_bot') {
            await handleBotSuggestionModal(interaction);
        }
        return;
    }

    if (interaction.isButton()) {
        console.log(`[Interaction] Button clicked: ${interaction.customId}`);
        const { customId } = interaction;

        // --- Handler for Suggestion Button ---
        if (customId === 'create_suggestion') {
             const command = client.commands.get('suggest');
             if (command) {
                 await (command.execute as any)(interaction, { subcommand: 'serveur' });
             }
             return;
        }

        // --- Handler for Content Creator Buttons ---
        if (customId === 'publish_content' || customId === 'cancel_content') {
             if (!interaction.channel || !interaction.message.embeds[0]) return;
             
             if (customId === 'publish_content') {
                 await (interaction.channel as TextChannel).send({ embeds: [interaction.message.embeds[0]] });
                 await interaction.update({ content: '✅ Contenu publié avec succès !', components: [] });
             } else {
                 await interaction.message.delete();
             }
        }
        
        // --- Handler for Private Room Button ---
        if (customId === 'create_private_room') {
            if (!interaction.guild || !interaction.member) return;
            const config = await getServerConfig(interaction.guild.id, 'private-rooms');
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
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                        },
                         {
                            id: client.user!.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
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
