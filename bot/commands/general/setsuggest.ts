
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const SetSuggestCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('setsuggest')
        .setDescription('Envoie le panneau de suggestions dans le salon actuel ou un salon spécifié.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Le salon où envoyer le panneau. Par défaut, le salon actuel.')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'suggestions');
        if (!config?.enabled) {
            await interaction.reply({ content: "Le module de suggestions est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const targetChannel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
        
        if (!targetChannel || !targetChannel.isTextBased()) {
            await interaction.editReply({ content: "Le salon spécifié n'est pas un salon textuel." });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Boîte à Suggestions')
            .setDescription('Vous avez une idée pour améliorer le serveur ?\nCliquez sur le bouton ci-dessous pour la partager avec nous !')
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() || undefined });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('create_suggestion')
                .setLabel('Faire une suggestion')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💡')
        );

        try {
            await targetChannel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: `✅ Le panneau de suggestions a été envoyé avec succès dans ${targetChannel}.` });
        } catch (error) {
            console.error('[SetSuggest] Error sending suggestion panel:', error);
            await interaction.editReply({ content: 'Une erreur est survenue. Vérifiez que j\'ai bien les permissions d\'envoyer des messages dans ce salon.' });
        }
    },
};

export default SetSuggestCommand;
