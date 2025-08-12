

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const EventListCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('event-list')
        .setDescription('Affiche la liste des événements à venir sur le serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const smartEventsConfig = await getServerConfig(interaction.guild.id, 'smart-events');

        if (!smartEventsConfig?.enabled) {
            await interaction.reply({ content: "Le module d'événements intelligents est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        // TODO: In a real implementation, you would:
        // 1. Fetch upcoming GuildScheduledEvents from the Discord API.
        // 2. Format them nicely into an embed or multiple pages.

        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle("Événements à Venir (Simulation)")
            .setDescription("- Événement 1 : Ce soir à 21h\n- Événement 2 : Demain à 18h")
            .setFooter({ text: 'Implémentation réelle à venir.' });
            
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
};

export default EventListCommand;
