
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ChannelType, TextChannel } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig, updateServerConfig, redeemPremiumKey } from '@/lib/db';

const SetCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Configure rapidement les paramètres essentiels du bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('log-channel')
                .setDescription('Définit le salon où les logs de modération seront envoyés.')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Le salon textuel pour les logs.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('suggestion-channel')
                .setDescription('Définit le salon où les suggestions seront envoyées.')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Le salon textuel pour les suggestions.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('premium-key')
                .setDescription('Active le statut Premium sur ce serveur avec une clé.')
                .addStringOption(option =>
                    option.setName('clé')
                        .setDescription('La clé d\'activation premium fournie par le développeur.')
                        .setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'log-channel': {
                    const channel = interaction.options.getChannel('salon', true) as TextChannel;
                    const modConfig = getServerConfig(interaction.guild.id, 'moderation');
                    const logsConfig = getServerConfig(interaction.guild.id, 'logs');

                    if (modConfig) updateServerConfig(interaction.guild.id, 'moderation', { ...modConfig, log_channel_id: channel.id });
                    if (logsConfig) updateServerConfig(interaction.guild.id, 'logs', { ...logsConfig, log_channel_id: channel.id });
                    
                    await interaction.editReply({ content: `✅ Le salon des logs a été défini sur ${channel}.` });
                    break;
                }

                case 'suggestion-channel': {
                    const channel = interaction.options.getChannel('salon', true) as TextChannel;
                    const suggestionsConfig = getServerConfig(interaction.guild.id, 'suggestions');
                    if (suggestionsConfig) {
                        updateServerConfig(interaction.guild.id, 'suggestions', { ...suggestionsConfig, suggestion_channel_id: channel.id });
                        await interaction.editReply({ content: `✅ Le salon de suggestions a été défini sur ${channel}.` });
                    }
                    break;
                }

                case 'premium-key': {
                    const key = interaction.options.getString('clé', true);
                    const result = redeemPremiumKey(key, interaction.guild.id);
                    
                    if (result.success) {
                        const embed = new EmbedBuilder()
                            .setColor(0xFFD700)
                            .setTitle('🎉 Premium Activé ! 🎉')
                            .setDescription('Ce serveur a maintenant accès à toutes les fonctionnalités premium. Merci pour votre soutien !')
                            .setTimestamp();
                        await interaction.editReply({ embeds: [embed] });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Erreur d\'activation')
                            .setDescription(result.message);
                        await interaction.editReply({ embeds: [embed] });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error(`[SetCommand] Error executing subcommand ${subcommand}:`, error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la configuration.' });
        }
    },
};

export default SetCommand;
