
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, User } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig, getUserSanctionHistory } from '../../../src/lib/db';

const ListWarnsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('listwarns')
        .setDescription("Affiche l'historique des avertissements d'un utilisateur.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription("L'utilisateur dont vous voulez voir les avertissements.")
                .setRequired(true)),

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

        const targetUser = interaction.options.getUser('utilisateur', true);

        await interaction.deferReply({ ephemeral: true });

        try {
            const history = getUserSanctionHistory(interaction.guild.id, targetUser.id)
                .filter(s => s.action_type === 'warn');

            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`Historique des avertissements de ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL());

            if (history.length === 0) {
                embed.setDescription("Cet utilisateur n'a aucun avertissement.");
            } else {
                embed.setDescription(`Cet utilisateur a **${history.length}** avertissement(s).`);
                for (const warn of history.slice(0, 25)) { // Limit to 25 fields
                    embed.addFields({
                        name: `Avertissement #${warn.id} - <t:${Math.floor(new Date(warn.timestamp).getTime() / 1000)}:R>`,
                        value: `**Raison :** ${warn.reason || 'Non spécifiée'}\n**Modérateur :** <@${warn.moderator_id}>`
                    });
                }
            }
            
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('[ListWarns] Error fetching warns:', error);
            await interaction.editReply({ content: "Une erreur est survenue lors de la récupération des avertissements." });
        }
    },
};

export default ListWarnsCommand;
