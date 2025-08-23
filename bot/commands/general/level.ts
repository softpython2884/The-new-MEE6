
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig, getUserLevel, getUserRank } from '@/lib/db';

const LevelCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Affiche votre niveau actuel et votre progression.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription("L'utilisateur dont vous voulez voir le niveau.")
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'leveling');
        if (!config?.enabled) {
            await interaction.reply({ content: 'Le système de niveaux est désactivé sur ce serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member || targetUser.bot) {
            await interaction.reply({ content: "Cet utilisateur n'est pas sur le serveur ou est un bot.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        try {
            const levelInfo = getUserLevel(targetUser.id, interaction.guild.id);
            const rank = getUserRank(targetUser.id, interaction.guild.id);

            const progressBarLength = 10;
            const progress = Math.floor((levelInfo.xp / levelInfo.requiredXp) * progressBarLength);
            const progressBar = '🟩'.repeat(progress) + '⬛'.repeat(progressBarLength - progress);

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setAuthor({ name: `Statistiques de ${member.displayName}`, iconURL: targetUser.displayAvatarURL() })
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'Niveau', value: `**${levelInfo.level}**`, inline: true },
                    { name: 'Classement', value: `#**${rank}**`, inline: true },
                    { name: 'Progression', value: `\`${levelInfo.xp} / ${levelInfo.requiredXp} XP\``, inline: false },
                    { name: 'Barre de progression', value: progressBar, inline: false }
                )
                .setFooter({ text: `ID: ${targetUser.id}`})
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('[LevelCommand] Error displaying level embed:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de l\'affichage de votre niveau.' });
        }
    },
};

export default LevelCommand;
