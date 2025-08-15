
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, User } from 'discord.js';
import type { Command } from '../../../src/types';
import { checkTesterStatus, getServerConfig } from '../../../src/lib/db';

const MpCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('mp')
        .setDescription('Envoie un message privé à un utilisateur. (Réservé aux Testeurs)')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à qui envoyer le message.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le message à envoyer.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const testerStatus = checkTesterStatus(interaction.user.id, interaction.guild.id);
        if (!testerStatus.isTester) {
            await interaction.reply({ content: 'Cette commande est réservée aux Testeurs du bot.', flags: MessageFlags.Ephemeral });
            return;
        }

        const targetUser = interaction.options.getUser('utilisateur', true);
        const messageContent = interaction.options.getString('message', true);

        if (targetUser.bot) {
            await interaction.reply({ content: 'Vous ne pouvez pas envoyer de message privé à un bot.', flags: MessageFlags.Ephemeral });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: `Message de la part de l'équipe de ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || undefined })
            .setDescription(messageContent)
            .setFooter({ text: `Ce message a été envoyé par ${interaction.user.tag} via le bot Marcus.`})
            .setTimestamp();

        try {
            await targetUser.send({ embeds: [embed] });
            await interaction.reply({ content: `✅ Message envoyé avec succès à **${targetUser.tag}**.`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(`[MpCommand] Could not send DM to ${targetUser.tag}:`, error);
            await interaction.reply({ content: `Impossible d'envoyer un message à cet utilisateur. Ses messages privés sont probablement désactivés.`, flags: MessageFlags.Ephemeral });
        }
    },
};

export default MpCommand;
