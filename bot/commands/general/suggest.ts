
import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const SuggestCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Fait une suggestion pour le serveur.'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'suggestions');
        if (!config?.enabled || !config.suggestion_channel_id) {
            await interaction.reply({ content: "Le module de suggestions est désactivé ou non configuré sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('suggestion_modal')
            .setTitle('Faire une suggestion');

        const titleInput = new TextInputBuilder()
            .setCustomId('suggestion_title')
            .setLabel("Titre de votre suggestion")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: Ajouter un salon pour les mèmes")
            .setRequired(true);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('suggestion_description')
            .setLabel("Décrivez votre suggestion en détail")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Expliquez pourquoi votre suggestion serait bénéfique pour le serveur...")
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    },
};

export default SuggestCommand;
