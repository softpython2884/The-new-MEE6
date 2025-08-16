
import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, EmbedBuilder } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const SuggestCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Faire une suggestion.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('serveur')
                .setDescription('Suggère une idée pour améliorer le serveur.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bot')
                .setDescription('Envoie une idée d\'amélioration pour le bot à son développeur.')),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const modal = new ModalBuilder();
        
        if (subcommand === 'serveur') {
            const config = await getServerConfig(interaction.guild.id, 'suggestions');
            if (!config?.enabled) {
                await interaction.reply({ content: "Le module de suggestions est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
                return;
            }

            modal.setCustomId('suggestion_modal_server').setTitle('Suggestion pour le Serveur');
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
                
            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput), new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput));

        } else if (subcommand === 'bot') {
            modal.setCustomId('suggestion_modal_bot').setTitle('Suggestion pour le Bot Marcus');
             const ideaInput = new TextInputBuilder()
                .setCustomId('suggestion_bot_idea')
                .setLabel("Votre idée pour améliorer le bot")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Décrivez en détail votre idée d'amélioration pour le bot.")
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(ideaInput));
        }

        await interaction.showModal(modal);
    },
};

export default SuggestCommand;
