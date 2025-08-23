
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, AttachmentBuilder } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig, getUserLevel, getUserRank } from '@/lib/db';
import { generateLevelCard } from '@/ai/flows/level-card-flow';

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

            const cardBuffer = await generateLevelCard({
                userName: member.displayName,
                avatarUrl: targetUser.displayAvatarURL({ extension: 'png', size: 256 }),
                currentLevel: levelInfo.level,
                currentXp: levelInfo.xp,
                requiredXp: levelInfo.requiredXp,
                rank: rank,
                backgroundUrl: config.level_card_background_url,
            });

            const attachment = new AttachmentBuilder(cardBuffer, { name: 'level-card.png' });
            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error('[LevelCommand] Error generating level card:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la création de votre carte de niveau.' });
        }
    },
};

export default LevelCommand;
