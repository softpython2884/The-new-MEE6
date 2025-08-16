
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';
import type { Command } from '../../src/types';

export const loadCommands = async (client: Client) => {
    const commands: any[] = [];
    const commandsPath = path.join(__dirname, '../commands');
    
    // Add faq.ts to the list of commands to load
    const commandFiles: string[] = [];
    
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

    for (const filePath of commandFiles) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const command: Command = require(filePath).default;
            if (command && command.data && command.execute) {
                if (!client.commands.has(command.data.name)) {
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                    console.log(`[+] Loaded command: /${command.data.name}`);
                }
            } else {
                 console.log(`[-] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        } catch(e) {
             console.log(`[E] The command at ${filePath} could not be loaded`, e);
        }
    }


    if (commands.length === 0) {
        console.log("No commands found to register.");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data: any = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
};
