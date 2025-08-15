
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Collection } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
        const categoryFolders = fs.readdirSync(commandsPath).filter(f => fs.statSync(path.join(commandsPath, f)).isDirectory());

        for (const folder of categoryFolders) {
            commandCategories.set(folder, []);
        }

        for (const command of commands.values()) {
            for(const category of categoryFolders) {
                const categoryPath = path.join(commandsPath, category);
                const commandFilePath = path.join(categoryPath, `${command.data.name}.ts`); // Adjust extension if needed
                 if (fs.existsSync(commandFilePath) || fs.existsSync(commandFilePath.replace('.ts', '.js'))) {
                    commandCategories.get(category)?.push(command);
                    break; 
                 }
                 // Handle files with different casing
                 const filesInDir = fs.readdirSync(categoryPath);
                 const foundFile = filesInDir.find(file => file.toLowerCase() === `${command.data.name}.ts`.toLowerCase() || file.toLowerCase() === `${command.data.name}.js`.toLowerCase());
                 if(foundFile) {
                    commandCategories.get(category)?.push(command);
                    break;
                 }
            }
        }


        const helpEmbed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('📜 Liste des Commandes de Marcus')
            .setDescription('Voici toutes les commandes que vous pouvez utiliser.')
            .setTimestamp()
            .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        for (const [category, commandList] of commandCategories.entries()) {
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

    