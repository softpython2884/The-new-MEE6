

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const EventCreateCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('event-create')
        .setDescription('Crée un nouvel événement sur le serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addStringOption(option => 
            option.setName('title')
                .setDescription('Le titre de l\'événement.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('La description de l\'événement.')
                .setRequired(true)),
        // TODO: Add more options like date, time, location, AI suggestions, etc.

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

        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);

        // TODO: In a real implementation, you would:
        // 1. Potentially call a Genkit flow to suggest optimal times based on server activity.
        // 2. Use the interaction options to create a GuildScheduledEvent.
        // 3. Store the event details in your database for tracking.

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`Événement Créé (Simulation) : ${title}`)
            .setDescription(description)
            .setFooter({ text: 'Implémentation de l\'IA et création réelle à venir.' });
            
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
};

export default EventCreateCommand;
