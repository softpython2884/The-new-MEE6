
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, Role, GuildMember } from 'discord.js';
import type { Command } from '../../../src/types';

const ALLOWED_USER_IDS = ['1403393080836493446', '556529963877138442'];

const GiveRoleCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('giverole')
        .setDescription('Attribue un rôle spécifié. (Accès restreint)')
        .setDefaultMemberPermissions(0) // Ne sera pas visible par défaut
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Le rôle à attribuer.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        // --- Vérification stricte des IDs autorisés ---
        if (!ALLOWED_USER_IDS.includes(interaction.user.id)) {
            await interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', flags: MessageFlags.Ephemeral });
            return;
        }

        const role = interaction.options.getRole('role', true) as Role;
        const member = interaction.member as GuildMember;

        try {
            if (member.roles.cache.has(role.id)) {
                await interaction.reply({ content: `Vous possédez déjà le rôle ${role.name}.`, flags: MessageFlags.Ephemeral });
                return;
            }

            await member.roles.add(role);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(`✅ Le rôle **${role.name}** vous a été attribué avec succès.`);
            
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error(`[GiveRole] Erreur lors de l'attribution du rôle:`, error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`❌ Une erreur est survenue lors de l'attribution du rôle. Vérifiez mes permissions et la hiérarchie des rôles.`);
            await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
    },
};

export default GiveRoleCommand;
