

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, TextChannel, GuildMember } from 'discord.js';
import type { Command } from '@/types';
import ms from 'ms';
import { getServerConfig } from '@/lib/db';

const MuteCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Rend un utilisateur muet (timeout).')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L\'utilisateur à rendre muet.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('La durée du mute (ex: 10m, 1h, 1d).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('La raison du mute.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', ephemeral: true });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'moderation');
        if (!config?.enabled) {
            await interaction.reply({ content: "Le module de modération est désactivé sur ce serveur.", ephemeral: true });
            return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const durationString = interaction.options.getString('duration', true);
        const reason = interaction.options.getString('reason', true);
        const moderator = interaction.user;

        const durationMs = ms(durationString);
        if (!durationMs) {
            await interaction.reply({ content: 'Durée invalide. Utilisez un format comme `10m`, `1h`, ou `7d`.', ephemeral: true });
            return;
        }
        // Discord API limit is 28 days for timeouts
        if (durationMs > ms('28d')) {
             await interaction.reply({ content: 'La durée du mute ne peut pas dépasser 28 jours.', ephemeral: true });
            return;
        }


        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
             await interaction.reply({ content: 'Cet utilisateur n\'est pas sur le serveur.', ephemeral: true });
             return;
        }
        
        if (targetMember.isCommunicationDisabled()) {
             await interaction.reply({ content: 'Cet utilisateur est déjà muet.', ephemeral: true });
             return;
        }

        if (interaction.member && 'roles' in interaction.member) {
            const moderatorMember = interaction.member as GuildMember;
            if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
                 await interaction.reply({ content: 'Vous ne pouvez pas rendre muet un membre avec un rôle égal ou supérieur au vôtre.', ephemeral: true });
                 return;
            }
        }
        
        if (!targetMember.moderatable) {
            await interaction.reply({ content: 'Je n\'ai pas la permission de rendre muet cet utilisateur. Vérifiez la hiérarchie des rôles.', ephemeral: true });
            return;
        }


        if (config.dm_user_on_action) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFFF00) // Yellow
                    .setTitle(`Vous avez été rendu muet sur ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Durée', value: durationString },
                        { name: 'Rendu muet par', value: moderator.tag }
                    )
                    .setTimestamp();
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.warn(`[Mute] Impossible d'envoyer un DM à ${targetUser.tag}.`);
            }
        }

        try {
            await targetMember.timeout(durationMs, `Rendu muet par ${moderator.tag} pour: ${reason}`);

            const replyEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(`✅ **${targetUser.tag}** a été rendu muet pour **${durationString}**.`);
            
            await interaction.reply({ embeds: [replyEmbed] });

            if (config.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id as string) as TextChannel;
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFF4500)
                        .setTitle('Action de Modération : Mute (Timeout)')
                        .addFields(
                            { name: 'Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
                            { name: 'Modérateur', value: `${moderator.tag} (${moderator.id})`, inline: false },
                            { name: 'Durée', value: durationString, inline: false },
                            { name: 'Raison', value: reason, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'ID de l\'utilisateur: ' + targetUser.id });
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('[Mute] Erreur lors du mute:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`❌ Une erreur est survenue lors du mute de **${targetUser.tag}**.`);
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

export default MuteCommand;
