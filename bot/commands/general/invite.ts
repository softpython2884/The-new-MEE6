
import { SlashCommandBuilder, CommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';

const InviteCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Génère un lien pour inviter le bot sur un serveur.'),
    async execute(interaction: ChatInputCommandInteraction) {
        // TODO: Fetch configuration from database for this server (interaction.guildId)
        // const config = await db.getServerConfig(interaction.guildId);
        // if (!config.modules.commands.invite_cmd) {
        //     await interaction.reply({ content: "Cette commande est désactivée sur ce serveur.", flags: MessageFlags.Ephemeral });
        //     return;
        // }

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
            flags: MessageFlags.Ephemeral, // Recommended to not spam the channel
        });
    },
};

export default InviteCommand;
