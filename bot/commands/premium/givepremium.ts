
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../../src/types';
import { setPremiumStatus } from '../../../src/lib/db';

const GivePremiumCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('givepremium')
        .setDescription('Donne le statut premium à un serveur. (Réservé au propriétaire du bot)')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('server_id')
                .setDescription('L\'ID du serveur à qui donner le premium.')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('status')
                .setDescription('Le statut premium à définir (True pour activer, False pour désactiver).')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const ownerId = '556529963877138442'; // Your Discord User ID

        if (interaction.user.id !== ownerId) {
            await interaction.reply({ content: 'Cette commande est réservée au propriétaire du bot.', ephemeral: true });
            return;
        }

        const guildId = interaction.options.getString('server_id', true);
        const status = interaction.options.getBoolean('status', true);

        try {
            // Check if the bot is in the target guild
            const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
            if (!guild) {
                await interaction.reply({ content: `Je ne suis pas sur le serveur avec l'ID \`${guildId}\`.`, ephemeral: true });
                return;
            }

            setPremiumStatus(guildId, status);

            const embed = new EmbedBuilder()
                .setColor(status ? 0x00FF00 : 0xFF0000)
                .setTitle('Statut Premium Mis à Jour')
                .setDescription(`Le statut premium pour le serveur **${guild.name}** (\`${guildId}\`) a été mis à **${status ? 'Activé' : 'Désactivé'}**.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('[GivePremium] Error setting premium status:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la mise à jour du statut premium.', ephemeral: true });
        }
    },
};

export default GivePremiumCommand;
