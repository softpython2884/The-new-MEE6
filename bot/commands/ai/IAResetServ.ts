

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const IAResetServCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('iaresetserv')
        .setDescription('Réinitialise la structure du serveur en se basant sur un thème.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('theme')
                .setDescription('Le nouveau thème pour la réinitialisation du serveur.')
                .setRequired(true)
                .addChoices(
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'Communauté', value: 'community' }
                )),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        await interaction.deferReply({ ephemeral: true });

        const serverBuilderConfig = await getServerConfig(interaction.guild.id, 'server-builder');

        if (!serverBuilderConfig?.enabled) {
            await interaction.editReply({ content: "Le module Server Builder IA est désactivé sur ce serveur." });
            return;
        }

        const theme = interaction.options.getString('theme', true);

        // TODO: In a real implementation, you would:
        // 1. Ask for user confirmation as this is a destructive action.
        // 2. Delete all existing channels and roles (or a subset).
        // 3. Call the same flow as /iacreateserv to generate the new structure.
        
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🚀 Réinitialisation du Serveur par l\'IA')
            .setDescription(`La réinitialisation de votre serveur sur le thème **${theme}** a commencé.`)
            .addFields({ name: 'Progression', value: 'Cette opération peut prendre plusieurs minutes.' })
            .setFooter({ text: 'Implémentation de la réinitialisation par IA à venir.' });
            
        await interaction.editReply({ embeds: [embed] });
    },
};

export default IAResetServCommand;
