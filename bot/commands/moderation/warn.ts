
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, TextChannel, GuildMember, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig, recordSanction, getUserSanctionHistory } from '../../../src/lib/db';
import ms from 'ms';

const WarnCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avertit un utilisateur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription("L'utilisateur à avertir.")
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription("La raison de l'avertissement.")
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        await interaction.deferReply({ ephemeral: true });

        const config = await getServerConfig(interaction.guild.id, 'moderation');
        if (!config?.enabled) {
            await interaction.editReply({ content: "Le module de modération est désactivé sur ce serveur." });
            return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason', true);
        const moderator = interaction.user;

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
             await interaction.editReply({ content: 'Cet utilisateur n\'est pas sur le serveur.' });
             return;
        }
        
        if (targetUser.id === moderator.id) {
            await interaction.editReply({ content: 'Vous ne pouvez pas vous avertir vous-même.' });
            return;
        }

        if (interaction.member && 'roles' in interaction.member) {
            const moderatorMember = interaction.member as GuildMember;
            if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
                 await interaction.editReply({ content: 'Vous ne pouvez pas avertir un membre avec un rôle égal ou supérieur au vôtre.' });
                 return;
            }
        }
        
        try {
            // Record the sanction
            recordSanction({
                guild_id: interaction.guild.id,
                user_id: targetUser.id,
                moderator_id: moderator.id,
                action_type: 'warn',
                reason: reason
            });

             const replyEmbed = new EmbedBuilder()
                .setColor(0xFFFF00) // Yellow
                .setDescription(`✅ **${targetUser.tag}** a été averti pour la raison : *${reason}*.`);
            
            await interaction.editReply({ embeds: [replyEmbed] });

            // Notify user
            if (config.dm_user_on_action) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(0xFFFF00) // Yellow
                        .setTitle(`Vous avez reçu un avertissement sur ${interaction.guild.name}`)
                        .addFields(
                            { name: 'Raison', value: reason },
                            { name: 'Averti par', value: moderator.tag }
                        )
                        .setTimestamp();
                    await targetUser.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.warn(`[Warn] Impossible d'envoyer un DM à ${targetUser.tag}.`);
                }
            }

            // Log the action
            if (config.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id as string) as TextChannel;
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFF4500)
                        .setTitle('Action de Modération : Avertissement')
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
            console.error('[Warn] Error during warn:', error);
            await interaction.editReply({ content: `Une erreur est survenue lors de l'avertissement de **${targetUser.tag}**.` });
        }
    },
};

export default WarnCommand;
