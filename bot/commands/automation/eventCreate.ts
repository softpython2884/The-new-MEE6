

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, GuildScheduledEventEntityType, GuildScheduledEventManager, GuildScheduledEventPrivacyLevel } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import { parse, isValid, isFuture } from 'date-fns';

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
                .setRequired(true))
        .addStringOption(option =>
            option.setName('location')
                .setDescription('Le lieu de l\'événement (salon vocal, lieu physique, ou URL).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('La date de début de l\'événement (format: JJ/MM/AAAA).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('L\'heure de début de l\'événement (format: HH:MM).')
                .setRequired(true)),

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

        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);
        const location = interaction.options.getString('location', true);
        const dateStr = interaction.options.getString('date', true);
        const timeStr = interaction.options.getString('time', true);

        const dateTimeStr = `${dateStr} ${timeStr}`;
        const scheduledStartTime = parse(dateTimeStr, 'dd/MM/yyyy HH:mm', new Date());

        if (!isValid(scheduledStartTime)) {
            await interaction.editReply({ content: 'Format de date ou d\'heure invalide. Utilisez JJ/MM/AAAA et HH:MM.' });
            return;
        }

        if (!isFuture(scheduledStartTime)) {
            await interaction.editReply({ content: 'La date et l\'heure de début doivent être dans le futur.' });
            return;
        }

        try {
            await interaction.guild.scheduledEvents.create({
                name: title,
                description: description,
                scheduledStartTime: scheduledStartTime,
                privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                entityType: GuildScheduledEventEntityType.External,
                entityMetadata: { location: location },
            });

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`Événement Créé : ${title}`)
                .setDescription(description)
                .addFields(
                    { name: 'Lieu', value: location, inline: true },
                    { name: 'Date & Heure', value: `<t:${Math.floor(scheduledStartTime.getTime() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `Événement créé par ${interaction.user.tag}`});
                
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('[EventCreate] Error creating scheduled event:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la création de l\'événement. Vérifiez mes permissions.' });
        }
    },
};

export default EventCreateCommand;
