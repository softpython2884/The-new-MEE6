
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

// Fonction pour déterminer à quel module appartient une commande
const getCommandModule = (command: Command): Module | 'unknown' => {
    const commandName = command.data.name;
    const commandFile = commandFiles.find(file => {
        const fileName = path.basename(file, '.ts').toLowerCase();
        const cmdName = commandName.split(' ')[0].toLowerCase();
        return fileName === cmdName;
    });

    if (commandFile) {
        const relativePath = path.relative(commandsPath, commandFile);
        const moduleName = relativePath.split(path.sep)[0];
        return moduleName as Module;
    }
    return 'unknown';
}

// Fonction pour mettre à jour les commandes pour UN serveur spécifique
export const updateGuildCommands = async (guildId: string, client: Client) => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
    const commandsToDeploy = [];

    for (const command of client.commands.values()) {
        const module = getCommandModule(command);
        
        // Commandes spéciales (owner only) qui ne doivent pas être déployées sur les serveurs
        if (['genpremium', 'givepremium'].includes(command.data.name)) {
            continue;
        }

        if (module !== 'unknown') {
            const config = getServerConfig(guildId, module);
            if (config?.enabled) {
                commandsToDeploy.push(command.data.toJSON());
            }
        } else {
            // Si le module est inconnu, on déploie par défaut (cas des commandes générales)
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
export const deployGlobalCommands = async () => {
     const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
     const globalCommands = [];
     
     const ownerCommands = ['genpremium', 'givepremium'];
     for(const cmdName of ownerCommands) {
        const command: Command = require(path.join(commandsPath, 'premium', `${cmdName}.ts`)).default;
        if (command) {
            // S'assure que la commande n'a pas de permissions par défaut restrictives
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
