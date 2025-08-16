
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { giveTesterStatus, revokeTesterStatus, checkTesterStatus } from '../../../src/lib/db';
import ms from 'ms';

const TESTER_OWNER_ID = '556529963877138442';

const TesterCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('tester')
        .setDescription('Gère le statut de Testeur pour les utilisateurs.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('give')
                .setDescription('Accorde manuellement le statut Testeur à un utilisateur. (Propriétaire du bot seulement)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('L\'utilisateur à qui accorder le statut.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('La durée du statut (ex: 30d, 1m, 1y). Laissez vide pour un statut permanent.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('revoke')
                .setDescription('Révoque manuellement le statut Testeur d\'un utilisateur. (Propriétaire du bot seulement)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('L\'utilisateur à qui retirer le statut.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Vérifie le statut Testeur d\'un utilisateur.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('L\'utilisateur à vérifier. Par défaut, vous-même.')
                        .setRequired(false))),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) {
            await interaction.editReply({ content: "Cette commande ne peut être utilisée que dans un serveur." });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Owner-only commands
        if (subcommand === 'give' || subcommand === 'revoke') {
            if (interaction.user.id !== TESTER_OWNER_ID) {
                await interaction.editReply({ content: 'Cette sous-commande est réservée au propriétaire du bot.' });
                return;
            }

            const userToModify = interaction.options.getUser('user', true);

            if (subcommand === 'give') {
                const durationString = interaction.options.getString('duration');
                let expiresAt: Date | null = null;
                if (durationString) {
                    const durationMs = ms(durationString);
                    if (!durationMs) {
                        await interaction.editReply({ content: 'Format de durée invalide. Utilisez par exemple `30d`, `2m`, `1y`.' });
                        return;
                    }
                    expiresAt = new Date(Date.now() + durationMs);
                }
                
                giveTesterStatus(userToModify.id, interaction.guild.id, expiresAt);
                const expiryMessage = expiresAt ? `Il expirera le <t:${Math.floor(expiresAt.getTime() / 1000)}:F>.` : 'Ce statut est permanent (sauf révocation manuelle).';
                await interaction.editReply({ content: `✅ Le statut de Testeur a été accordé à **${userToModify.tag}**. ${expiryMessage}` });

            } else { // revoke
                revokeTesterStatus(userToModify.id, interaction.guild.id);
                await interaction.editReply({ content: `✅ Le statut de Testeur a été révoqué pour **${userToModify.tag}**.` });
            }

        } else if (subcommand === 'status') {
            const status = checkTesterStatus(targetUser.id, interaction.guild.id);

            const embed = new EmbedBuilder()
                .setColor(status.isTester ? 0x00FF00 : 0xFF0000)
                .setTitle(`Statut Testeur de ${targetUser.tag}`)
                .setTimestamp();

            if (status.isTester) {
                const expiryText = status.expires_at 
                    ? `Expire le <t:${Math.floor(status.expires_at.getTime() / 1000)}:R>` 
                    : "N'expire pas (lié à un boost de serveur ou permanent).";
                embed.setDescription(`✅ Cet utilisateur **est** un Testeur.\n> ${expiryText}`);
            } else {
                embed.setDescription('❌ Cet utilisateur n\'est pas un Testeur.');
            }
            
            await interaction.editReply({ embeds: [embed] });
        }
    },
};

export default TesterCommand;
