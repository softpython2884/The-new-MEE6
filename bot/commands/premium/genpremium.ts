
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { createPremiumKey } from '../../../src/lib/db';

const OWNER_ID = '556529963877138442';

const GenPremiumCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('genpremium')
        .setDescription('Génère une nouvelle clé d\'activation premium. (Propriétaire seulement)')
        .setDMPermission(false), // Commande de serveur uniquement

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.user.id !== OWNER_ID) {
            await interaction.reply({ content: 'Cette commande est réservée au propriétaire du bot.', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            const newKey = createPremiumKey(interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔑 Clé Premium Générée')
                .setDescription(`Une nouvelle clé a été générée avec succès.`)
                .addFields({ name: 'Clé d\'activation', value: `\`${newKey}\`` })
                .setFooter({ text: 'Donnez cette clé à un administrateur de serveur pour qu\'il l\'active avec /set premium-key.' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('[GenPremium] Error creating premium key:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la création de la clé.', flags: MessageFlags.Ephemeral });
        }
    },
};

export default GenPremiumCommand;
