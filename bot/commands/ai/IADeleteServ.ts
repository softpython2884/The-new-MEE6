

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const IADeleteServCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('iadeleteserv')
        .setDescription('Supprime des éléments du serveur (salons, rôles) avec l\'aide de l\'IA.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('target')
                .setDescription('L\'élément à supprimer (ex: "la catégorie Gaming", "le rôle @Streamer").')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', ephemeral: true });
            return;
        }
        
        const serverBuilderConfig = await getServerConfig(interaction.guild.id, 'server-builder');
        
        if (!serverBuilderConfig?.enabled) {
            await interaction.reply({ content: "Le module Server Builder IA est désactivé sur ce serveur.", ephemeral: true });
            return;
        }

        const target = interaction.options.getString('target', true);

        // TODO: In a real implementation, you would:
        // 1. Call a Genkit flow to understand the target and confirm the deletion plan.
        // 2. The bot would then delete the specified elements.
        
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚀 Suppression d\'éléments par l\'IA')
            .setDescription(`Votre demande de suppression est en cours : "${target}"`)
            .addFields({ name: 'Progression', value: 'Vous serez notifié lorsque ce sera terminé.' })
            .setFooter({ text: 'Implémentation de la suppression par IA à venir.' });
            
        await interaction.editReply({ embeds: [embed] });
    },
};

export default IADeleteServCommand;
