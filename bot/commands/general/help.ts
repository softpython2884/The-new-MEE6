
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Collection } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Helper function to recursively find all command files
const getAllCommandFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllCommandFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.js')) {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        }
    });

    return arrayOfFiles;
};

const HelpCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste de toutes les commandes disponibles.'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guildId) {
            await interaction.editReply({ content: "Une erreur est survenue." });
            return;
        }

        const config = await getServerConfig(interaction.guildId, 'general-commands');
        if (!config?.command_enabled?.help) {
            await interaction.editReply({ content: "Cette commande est désactivée sur ce serveur." });
            return;
        }
        
        const commands = interaction.client.commands;
        const commandCategories = new Collection<string, Command[]>();
        
        const commandsPath = path.join(__dirname, '..');
        
        // Get all command file paths recursively
        const allCommandFiles = getAllCommandFiles(commandsPath);

        // Group commands by category (subfolder name)
        for (const command of commands.values()) {
            const commandName = command.data.name.split(' ')[0];
            const commandFile = allCommandFiles.find(file => path.basename(file, '.ts') === commandName || path.basename(file, '.js') === commandName);

            if (commandFile) {
                const category = path.basename(path.dirname(commandFile));
                if (!commandCategories.has(category)) {
                    commandCategories.set(category, []);
                }
                commandCategories.get(category)?.push(command);
            }
        }

        const helpEmbed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('📜 Liste des Commandes de Marcus')
            .setDescription('Voici toutes les commandes que vous pouvez utiliser.')
            .setTimestamp()
            .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        
        // Sort categories alphabetically
        const sortedCategories = new Collection(Array.from(commandCategories.entries()).sort());


        for (const [category, commandList] of sortedCategories.entries()) {
            if (commandList.length > 0) {
                const commandString = commandList
                    .map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`)
                    .join('\n');
                helpEmbed.addFields({ name: `**${capitalize(category)}**`, value: commandString });
            }
        }

        await interaction.editReply({ embeds: [helpEmbed] });
    },
};

export default HelpCommand;
