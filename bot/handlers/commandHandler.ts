
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
            const command: Command = require(filePath).default;
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
    const commandFile = commandFiles.find(file => path.basename(file, '.ts').toLowerCase() === commandName.toLowerCase());
    if (commandFile) {
        const relativePath = path.relative(commandsPath, commandFile);
        const moduleDir = relativePath.split(path.sep)[0];
        
        // This mapping ensures that directory names match the Module type
        const moduleMap: { [key: string]: Module } = {
            'ai': 'content-ai', // Example, adjust as needed
            'automation': 'private-rooms', // Example
            'config': 'general-commands',
            'general': 'general-commands',
            'moderation': 'moderation',
            'premium': 'premium',
            'security': 'security-alerts'
        };

        // A more robust mapping based on command properties would be better
        if (['iacreateserv', 'iaeditserv', 'iadeleteserv', 'iaresetserv'].includes(commandName)) return 'server-builder';
        if (['faq'].includes(commandName)) return 'community-assistant';
        if (['personnage'].includes(commandName)) return 'ai-personas';
        if (['lock', 'unlock'].includes(commandName)) return 'lock';
        
        return moduleMap[moduleDir] || 'unknown';
    }
    return 'unknown';
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

        if (module !== 'unknown') {
            const config = getServerConfig(guildId, module);
            if (config?.enabled) {
                commandsToDeploy.push(command.data.toJSON());
            }
        } else {
             // Fallback for general commands or those without a specific module toggle
             // This assumes 'general-commands' module enables most basic commands
             const generalConfig = getServerConfig(guildId, 'general-commands');
             if(generalConfig?.enabled) {
                 commandsToDeploy.push(command.data.toJSON());
             }
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
             command.data.setDefaultMemberPermissions(undefined);
             globalCommands.push(command.data.toJSON());
        }
     }

     try {
        console.log(`[Commands] Refreshing ${globalCommands.length} global (owner) commands.`);
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
            { body: globalCommands },
        );
        console.log(`[Commands] Successfully reloaded global commands.`);
     } catch(error) {
        console.error('[Commands] Failed to deploy global commands:', error);
     }
}
