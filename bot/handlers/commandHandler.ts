
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';
import type { Command, Module } from '../../src/types';
import { getServerConfig } from '@/lib/db';

const commandsPath = path.join(__dirname, '../commands');
const commandFiles: string[] = [];

// Fonction pour parcourir les dossiers et trouver tous les fichiers de commandes
const traverseDirectory = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            traverseDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
            commandFiles.push(fullPath);
        }
    }
};

traverseDirectory(commandsPath);

// Charge toutes les commandes dans la collection du client
export const loadCommands = (client: Client) => {
    for (const filePath of commandFiles) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const commandModule = require(filePath);
            const command: Command = commandModule.default || commandModule;

            if (command && command.data && command.execute) {
                if (!client.commands.has(command.data.name)) {
                    client.commands.set(command.data.name, command);
                }
            }
        } catch(e) {
            console.log(`[E] The command at ${filePath} could not be loaded`, e);
        }
    }
    console.log(`[+] Loaded ${client.commands.size} command modules into the client.`);
};

// Helper function to map a command name to its module folder
const getCommandModule = (commandName: string): Module | 'unknown' => {
    const commandFile = commandFiles.find(file => {
        const baseName = path.basename(file, '.ts').toLowerCase();
        const jsBaseName = path.basename(file, '.js').toLowerCase();
        return baseName === commandName.toLowerCase() || jsBaseName === commandName.toLowerCase();
    });

    if (!commandFile) return 'unknown';

    const relativePath = path.relative(commandsPath, commandFile);
    const moduleDir = relativePath.split(path.sep)[0];
    
    // This is a mapping from folder name to module name in the DB
    const moduleMap: { [key: string]: Module } = {
        'moderation': 'moderation',
        'security': 'security-alerts', // A reasonable default
        'automation': 'private-rooms', // A reasonable default
        'ai': 'content-ai', // A reasonable default
        'premium': 'premium', // A special case for premium commands
        'general': 'general-commands',
    };
    
    // Command-specific overrides for multi-module folders
    if (['lock', 'unlock'].includes(commandName)) return 'lock';
    if (['backup'].includes(commandName)) return 'backup';
    if (['iacreateserv', 'iaeditserv', 'iadeleteserv', 'iaresetserv'].includes(commandName)) return 'server-builder';
    if (['personnage'].includes(commandName)) return 'ai-personas';
    if (['faq'].includes(commandName)) return 'community-assistant';
    if (['traduire'].includes(commandName)) return 'general-commands';
    if (['addprivate', 'privateresum'].includes(commandName)) return 'private-rooms';
    if (['event-create', 'event-list'].includes(commandName)) return 'smart-events';
    if (['setsuggest', 'suggest'].includes(commandName)) return 'suggestions';


    return moduleMap[moduleDir] || 'unknown';
}


// Fonction pour mettre à jour les commandes pour UN serveur spécifique
export const updateGuildCommands = async (guildId: string, client: Client) => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
    const commandsToDeploy = [];

    for (const command of client.commands.values()) {
        const commandName = command.data.name;

        // Owner-only commands are global and should not be deployed to guilds
        if (['genpremium', 'givepremium'].includes(commandName)) {
            continue;
        }

        const module = getCommandModule(commandName);
        
        if (module === 'unknown') {
             commandsToDeploy.push(command.data.toJSON());
             continue;
        }
        
        const config = await getServerConfig(guildId, module);

        // A special check for commands within the 'general-commands' module that can be individually toggled
        if (module === 'general-commands' && config?.enabled) {
            if (config?.command_enabled?.[commandName]) {
                 commandsToDeploy.push(command.data.toJSON());
            }
        }
        else if (config?.enabled) {
            commandsToDeploy.push(command.data.toJSON());
        }
    }

    try {
        console.log(`[Commands] Refreshing ${commandsToDeploy.length} commands for guild ${guildId}.`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId),
            { body: commandsToDeploy },
        );
        console.log(`[Commands] Successfully reloaded commands for guild ${guildId}.`);
    } catch (error) {
        if ((error as any).code === 50001) {
             console.warn(`[Commands] Missing Access to refresh commands for guild ${guildId}. The bot might have been kicked.`);
        } else {
            console.error(`[Commands] Failed to refresh commands for guild ${guildId}:`, error);
        }
    }
};


// Déploie les commandes globales (commandes "owner" uniquement)
export const deployGlobalCommands = async (client: Client) => {
     const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
     const globalCommands = [];
     
     const ownerCommands = ['genpremium', 'givepremium'];
     for(const cmdName of ownerCommands) {
        const command = client.commands.get(cmdName);
        if (command) {
             command.data.setDefaultMemberPermissions(undefined); // No permissions required by default, handled in code
             globalCommands.push(command.data.toJSON());
        }
     }

     try {
        if (globalCommands.length > 0) {
            console.log(`[Commands] Refreshing ${globalCommands.length} global (owner) commands.`);
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
                { body: globalCommands },
            );
            console.log(`[Commands] Successfully reloaded global commands.`);
        } else {
            console.log('[Commands] No global commands to refresh.');
        }
     } catch(error) {
        console.error('[Commands] Failed to deploy global commands:', error);
     }
}

    