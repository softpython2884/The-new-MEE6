
import { SlashCommandBuilder, CommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const InviteCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Génère un lien pour inviter le bot sur un serveur.'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
             await interaction.reply({ content: "Une erreur est survenue.", flags: MessageFlags.Ephemeral });
             return;
        }

        const config = await getServerConfig(interaction.guildId, 'general-commands');
        if (!config?.command_enabled?.invite) {
            await interaction.reply({ content: "Cette commande est désactivée sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        // TODO: Check for role permissions from config.command_permissions.invite

        const clientId = process.env.DISCORD_CLIENT_ID;
        if (!clientId) {
            await interaction.reply({ content: "Une erreur de configuration empêche la création du lien d'invitation.", flags: MessageFlags.Ephemeral });
            return;
        }

        // Permissions Administrator for simplicity, as requested
        const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;

        const inviteButton = new ButtonBuilder()
            .setLabel('Invitez-moi !')
            .setURL(inviteUrl)
            .setStyle(ButtonStyle.Link);
            
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(inviteButton);

        await interaction.reply({
            content: "Cliquez sur le bouton ci-dessous pour m'ajouter à votre serveur !",
            components: [row],
            flags: MessageFlags.Ephemeral,
        });
    },
};

export default InviteCommand;
