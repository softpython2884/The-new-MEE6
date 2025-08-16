
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Collection } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// This function is inefficient and uses sync I/O. 
// A better implementation would involve adding a 'category' property to the Command interface 
// and grouping by that property. For now, this approach works.
const getCommandCategory = (command: Command, commandsPath: string): string => {
    const commandName = command.data.name.split(' ')[0];
    
    const findInCategory = (dir: string): string | null => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                const found = findInCategory(fullPath);
                if (found) return path.basename(dir);
            } else if (path.basename(file, '.ts') === commandName || path.basename(file, '.js') === commandName) {
                 return path.basename(dir);
            }
        }
        return null;
    }
    
    return findInCategory(commandsPath) || 'uncategorized';
}


const MarcusCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('marcus')
        .setDescription('Affiche la liste de toutes les commandes disponibles.'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guildId) {
            await interaction.editReply({ content: "Une erreur est survenue." });
            return;
        }

        const config = await getServerConfig(interaction.guildId, 'general-commands');
        if (!config?.command_enabled?.marcus) {
            await interaction.editReply({ content: "Cette commande est désactivée sur ce serveur." });
            return;
        }
        
        const commands = interaction.client.commands;
        const commandCategories = new Collection<string, Command[]>();
        
        // This is a simplified approach to getting categories. 
        // In a more robust system, the category should be a property of the command itself.
        const commandsPath = path.join(__dirname, '..');
        
        for (const command of commands.values()) {
            const category = getCommandCategory(command, commandsPath);
            if (!commandCategories.has(category)) {
                commandCategories.set(category, []);
            }
            commandCategories.get(category)?.push(command);
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
            if (category !== 'uncategorized' && commandList.length > 0) {
                const commandString = commandList
                    .map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`)
                    .join('\n');
                helpEmbed.addFields({ name: `**${capitalize(category)}**`, value: commandString });
            }
        }

        await interaction.editReply({ embeds: [helpEmbed] });
    },
};

export default MarcusCommand;
