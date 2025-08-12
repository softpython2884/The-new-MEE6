

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, GuildScheduledEventStatus } from 'discord.js';
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

        await interaction.deferReply({ ephemeral: true });
        
        try {
            const events = await interaction.guild.scheduledEvents.fetch();
            const upcomingEvents = events.filter(event => event.status === GuildScheduledEventStatus.Scheduled);

            if (upcomingEvents.size === 0) {
                await interaction.editReply({ content: 'Aucun événement n\'est programmé pour le moment.' });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`Événements à Venir sur ${interaction.guild.name}`)
                .setDescription('Voici la liste des prochains événements programmés.');

            for (const event of upcomingEvents.values()) {
                embed.addFields({
                    name: `🗓️ ${event.name}`,
                    value: `> **Quand ?** <t:${Math.floor(event.scheduledStartTimestamp! / 1000)}:R>\n> **Où ?** ${event.entityMetadata?.location || 'Non spécifié'}\n> [Voir l'événement](${event.url})`,
                    inline: false,
                });
            }
                
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('[EventList] Error fetching events:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la récupération des événements.' });
        }
    },
};

export default EventListCommand;
