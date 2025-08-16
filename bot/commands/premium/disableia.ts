
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { setGlobalAiStatus } from '../../../src/lib/db';

const OWNER_ID = '556529963877138442';

const DisableIACommand: Command = {
    data: new SlashCommandBuilder()
        .setName('disableia')
        .setDescription('Désactive toutes les fonctionnalités IA du bot globalement. (Propriétaire seulement)')
        .setDMPermission(true)
        .addStringOption(option => 
            option.setName('raison')
                .setDescription('La raison de la désactivation.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.user.id !== OWNER_ID) {
            await interaction.reply({ content: 'Cette commande est réservée au propriétaire du bot.', flags: MessageFlags.Ephemeral });
            return;
        }

        const reason = interaction.options.getString('raison', true);

        try {
            setGlobalAiStatus(true, reason);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔴 Intelligence Artificielle Désactivée')
                .setDescription('Toutes les fonctionnalités IA du bot ont été désactivées globalement.')
                .addFields({ name: 'Raison', value: reason })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('[DisableIA] Error disabling AI features:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la désactivation des fonctionnalités IA.', flags: MessageFlags.Ephemeral });
        }
    },
};

export default DisableIACommand;
