

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, TextChannel, User, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';


const BanCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannit un utilisateur du serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L\'utilisateur à bannir.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('La raison du bannissement.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('delete_message_days')
                .setDescription('Nombre de jours de messages à supprimer (0-7).')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        // 1. Check if the module is enabled for this server from DB
        const config = await getServerConfig(interaction.guild.id, 'moderation');
        if (!config?.enabled) {
            await interaction.editReply({ content: "Le module de modération (Bans & Kicks) est désactivé sur ce serveur." });
            return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason', true).substring(0, 512); // Discord API limit for reason
        const deleteMessageDays = interaction.options.getInteger('delete_message_days') || 0;
        const moderator = interaction.user;

        // You can't ban yourself
        if (targetUser.id === moderator.id) {
            await interaction.editReply({ content: 'Vous ne pouvez pas vous bannir vous-même.' });
            return;
        }
        
        // You can't ban the bot
        if (targetUser.id === interaction.client.user.id) {
            await interaction.editReply({ content: 'Vous ne pouvez pas me bannir.' });
            return;
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Check if the target user has a higher or equal role than the moderator
        if (targetMember && interaction.member && 'roles' in interaction.member) {
            const moderatorMember = await interaction.guild.members.fetch(moderator.id);
            if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
                 await interaction.editReply({ content: 'Vous ne pouvez pas bannir un membre avec un rôle égal ou supérieur au vôtre.' });
                 return;
            }
        }
        
        // Check if bot has permissions to ban
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
        if (targetMember && !targetMember.bannable) {
            await interaction.editReply({ content: 'Je n\'ai pas la permission de bannir cet utilisateur. Vérifiez la hiérarchie des rôles.' });
            return;
        }


        // 2. Notify user if enabled in config
        if (config.dm_user_on_action) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle(`Vous avez été banni de ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Banni par', value: moderator.tag }
                    )
                    .setTimestamp();
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.warn(`[Ban] Impossible d'envoyer un DM à ${targetUser.tag}. L'utilisateur a peut-être bloqué le bot ou désactivé ses DMs.`);
                // Do not stop the ban process, just log the warning
            }
        }

        try {
            // 3. Perform the ban
            await interaction.guild.members.ban(targetUser, {
                reason: `Banni par ${moderator.tag} pour: ${reason}`,
                deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60, // API expects seconds
            });

            const replyEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(`✅ **${targetUser.tag}** a été banni avec succès.`);
            
            await interaction.editReply({ embeds: [replyEmbed] });

            // 4. Send log if enabled
            if (config.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id as string) as TextChannel;
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFF4500) // OrangeRed
                        .setTitle('Action de Modération : Bannissement')
                        .addFields(
                            { name: 'Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
                            { name: 'Modérateur', value: `${moderator.tag} (${moderator.id})`, inline: false },
                            { name: 'Raison', value: reason, inline: false },
                            { name: 'Suppression des messages', value: `${deleteMessageDays} jour(s)`, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'ID de l'utilisateur: ' + targetUser.id });
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('[Ban] Erreur lors du bannissement:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`❌ Une erreur est survenue lors du bannissement de **${targetUser.tag}**.`);

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};

export default BanCommand;

    