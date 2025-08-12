

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, TextChannel, AutocompleteInteraction, ApplicationCommandOptionChoiceData, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const UnbanCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Révoque le bannissement d\'un utilisateur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('L\'ID de l\'utilisateur à débannir.')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction: AutocompleteInteraction) {
        if (!interaction.guild) return;
        const focusedValue = interaction.options.getFocused();
        
        try {
            const bannedUsers = await interaction.guild.bans.fetch();
            if (bannedUsers.size === 0) {
                 await interaction.respond([]);
                 return;
            }

            const choices = bannedUsers
                .map(banInfo => ({
                    name: `${banInfo.user.tag} (${banInfo.user.id})`,
                    value: banInfo.user.id,
                }))
                .filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25); // Discord limit for choices

            await interaction.respond(choices as ApplicationCommandOptionChoiceData[]);
        } catch (error) {
            console.error('[Unban Autocomplete] Error fetching banned users:', error);
            await interaction.respond([]);
        }
    },

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'moderation');
        if (!config?.enabled) {
            await interaction.reply({ content: "Le module de modération est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        const userIdToUnban = interaction.options.getString('user_id', true);
        const moderator = interaction.user;

        try {
            // Fetch the user to get their tag for the embeds
            const targetUser = await interaction.client.users.fetch(userIdToUnban);
            
            await interaction.guild.members.unban(userIdToUnban, `Débanni par ${moderator.tag}`);

            const replyEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(`✅ **${targetUser.tag}** a été débanni avec succès.`);
            
            await interaction.reply({ embeds: [replyEmbed] });

            if (config.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id as string) as TextChannel;
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x00BFFF) // DeepSkyBlue
                        .setTitle('Action de Modération : Débannissement')
                        .addFields(
                            { name: 'Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
                            { name: 'Modérateur', value: `${moderator.tag} (${moderator.id})`, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'ID de l\'utilisateur: ' + targetUser.id });
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('[Unban] Erreur lors du débannissement:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`❌ Impossible de débannir l'utilisateur avec l'ID **${userIdToUnban}**. Vérifiez si l'ID est correct et si l'utilisateur est bien banni.`);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            } else {
                 await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            }
        }
    },
};

export default UnbanCommand;
