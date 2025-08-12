

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, TextChannel, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';


const KickCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulse un utilisateur du serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L\'utilisateur à expulser.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('La raison de l\'expulsion.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'moderation');
        if (!config?.enabled) {
            await interaction.reply({ content: "Le module de modération (Bans & Kicks) est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason', true);
        const moderator = interaction.user;

        if (targetUser.id === moderator.id) {
            await interaction.reply({ content: 'Vous ne pouvez pas vous expulser vous-même.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        if (targetUser.id === interaction.client.user.id) {
            await interaction.reply({ content: 'Vous ne pouvez pas m\'expulser.', flags: MessageFlags.Ephemeral });
            return;
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
             await interaction.reply({ content: 'Cet utilisateur n\'est pas sur le serveur.', flags: MessageFlags.Ephemeral });
             return;
        }
        
        if (interaction.member && 'roles' in interaction.member) {
            const moderatorMember = await interaction.guild.members.fetch(moderator.id);
            if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
                 await interaction.reply({ content: 'Vous ne pouvez pas expulser un membre avec un rôle égal ou supérieur au vôtre.', flags: MessageFlags.Ephemeral });
                 return;
            }
        }
        
        if (!targetMember.kickable) {
            await interaction.reply({ content: 'Je n\'ai pas la permission d\'expulser cet utilisateur. Vérifiez la hiérarchie des rôles.', flags: MessageFlags.Ephemeral });
            return;
        }

        if (config.dm_user_on_action) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFA500) // Orange
                    .setTitle(`Vous avez été expulsé de ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason },
                        { name: 'Expulsé par', value: moderator.tag }
                    )
                    .setTimestamp();
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.warn(`[Kick] Impossible d'envoyer un DM à ${targetUser.tag}.`);
            }
        }

        try {
            await targetMember.kick(`Expulsé par ${moderator.tag} pour: ${reason}`);

            const replyEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(`✅ **${targetUser.tag}** a été expulsé avec succès.`);
            
            await interaction.reply({ embeds: [replyEmbed] });

            if (config.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id as string) as TextChannel;
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFF4500)
                        .setTitle('Action de Modération : Expulsion')
                        .addFields(
                            { name: 'Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
                            { name: 'Modérateur', value: `${moderator.tag} (${moderator.id})`, inline: false },
                            { name: 'Raison', value: reason, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'ID de l\'utilisateur: ' + targetUser.id });
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('[Kick] Erreur lors de l\'expulsion:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`❌ Une erreur est survenue lors de l'expulsion de **${targetUser.tag}**.`);
            await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
    },
};

export default KickCommand;
