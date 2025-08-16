
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { setGlobalAiStatus } from '../../../src/lib/db';

const OWNER_ID = '556529963877138442';

const EnableIACommand: Command = {
    data: new SlashCommandBuilder()
        .setName('enableia')
        .setDescription('Réactive toutes les fonctionnalités IA du bot globalement. (Propriétaire seulement)')
        .setDMPermission(true),

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.user.id !== OWNER_ID) {
            await interaction.reply({ content: 'Cette commande est réservée au propriétaire du bot.', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            setGlobalAiStatus(false, null);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🟢 Intelligence Artificielle Réactivée')
                .setDescription('Toutes les fonctionnalités IA du bot ont été réactivées globalement.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('[EnableIA] Error enabling AI features:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la réactivation des fonctionnalités IA.', flags: MessageFlags.Ephemeral });
        }
    },
};

export default EnableIACommand;
