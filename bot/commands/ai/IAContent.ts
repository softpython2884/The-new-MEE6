

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';

const IAContentCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('iacontent')
        .setDescription('Génère du contenu avec l\'IA (annonces, règles, images).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('rule')
                .setDescription('Rédige une règle pour le serveur.')
                .addStringOption(option =>
                    option.setName('topic')
                        .setDescription('Le sujet de la règle (ex: "spam", "respect").')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('announcement')
                .setDescription('Rédige une annonce pour le serveur.')
                .addStringOption(option =>
                    option.setName('topic')
                        .setDescription('Le sujet de l\'annonce (ex: "nouvel événement", "mise à jour du bot").')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('image')
                .setDescription('Génère une image avec l\'IA.')
                .addStringOption(option =>
                    option.setName('prompt')
                        .setDescription('La description de l\'image à générer.')
                        .setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', ephemeral: true });
            return;
        }

        const contentAiConfig = await getServerConfig(interaction.guild.id, 'content-ai');

        if (!contentAiConfig?.enabled) {
            await interaction.reply({ content: "Le module Créateur de Contenu IA est désactivé sur ce serveur.", ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'rule': {
                    const topic = interaction.options.getString('topic', true);
                    // TODO: Call Genkit flow to generate a rule text.
                    const embed = new EmbedBuilder()
                        .setColor(0x00BFFF)
                        .setTitle(`📝 Règle générée pour : ${topic}`)
                        .setDescription(`Voici une proposition de règle sur le thème "${topic}". (Implémentation IA à venir)`);
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
                case 'announcement': {
                    const topic = interaction.options.getString('topic', true);
                    // TODO: Call Genkit flow to generate an announcement text.
                    const embed = new EmbedBuilder()
                        .setColor(0x9932CC)
                        .setTitle(`📢 Annonce générée pour : ${topic}`)
                        .setDescription(`Voici une proposition d'annonce sur le thème "${topic}". (Implémentation IA à venir)`);
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
                case 'image': {
                    const prompt = interaction.options.getString('prompt', true);
                    // TODO: Call Genkit flow to generate an image and get the URL.
                    const embed = new EmbedBuilder()
                        .setColor(0xFFD700)
                        .setTitle('🖼️ Image en cours de génération...')
                        .setDescription(`Votre image pour le prompt : "${prompt}" est en cours de création. (Implémentation IA à venir)`);
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error(`[IAContent] Error executing subcommand ${subcommand}:`, error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la génération du contenu.' });
        }
    },
};

export default IAContentCommand;
