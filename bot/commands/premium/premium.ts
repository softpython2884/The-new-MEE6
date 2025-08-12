
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const PremiumCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Vérifie le statut premium du serveur.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            // We can check any module, they all share the premium status for a guild.
            const config = getServerConfig(interaction.guild.id, 'moderation');
            const isPremium = config?.premium || false;

            const embed = new EmbedBuilder()
                .setTitle('Statut Premium')
                .setTimestamp()
                .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            if (isPremium) {
                embed
                    .setColor(0xFFD700) // Gold
                    .setDescription(`✅ Ce serveur bénéficie des avantages **Premium** ! Merci pour votre soutien.`)
                    .addFields({ name: 'Avantages', value: '- Accès à toutes les fonctionnalités IA.\n- Commandes exclusives.\n- Et bien plus encore !' });
            } else {
                embed
                    .setColor(0x95A5A6) // Gray
                    .setDescription(`Ce serveur n'a pas le statut Premium.`)
                     .addFields({ name: 'Comment obtenir le Premium ?', value: 'Visitez notre site web ou rejoignez notre serveur de support pour en savoir plus ! (Liens à venir)' });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[PremiumCommand] Error checking premium status:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la vérification du statut premium.', flags: MessageFlags.Ephemeral });
        }
    },
};

export default PremiumCommand;
