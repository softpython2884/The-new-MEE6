
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import { generateTextContent, generateImage } from '../../../src/ai/flows/content-creation-flow';

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
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'content-ai');

        if (!config?.enabled || !config.premium) {
            await interaction.reply({ content: "Le module Créateur de Contenu IA est désactivé ou non-premium sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'rule':
                case 'announcement': {
                    const topic = interaction.options.getString('topic', true);
                    const result = await generateTextContent({
                        type: subcommand as 'rule' | 'announcement',
                        topic: topic,
                        tone: config.default_tone,
                        customInstructions: config.custom_instructions
                    });

                    const embed = new EmbedBuilder()
                        .setColor(subcommand === 'rule' ? 0x00BFFF : 0x9932CC)
                        .setTitle(result.title.substring(0, 256))
                        .setDescription(result.generatedText.substring(0, 4096));

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('publish_content')
                            .setLabel('Publier')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('✅'),
                        new ButtonBuilder()
                            .setCustomId('cancel_content')
                            .setLabel('Annuler')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🗑️')
                    );
                    
                    await interaction.editReply({ embeds: [embed], components: [row] });
                    break;
                }
                case 'image': {
                    const prompt = interaction.options.getString('prompt', true);
                    
                    await interaction.editReply({ content: '🖼️ Votre image est en cours de création, veuillez patienter...' });

                    const result = await generateImage({
                        prompt: prompt,
                        allow_nsfw: config.allow_nsfw_images || false,
                    });

                    if (result.imageDataUri) {
                        const imageBuffer = Buffer.from(result.imageDataUri.split(',')[1], 'base64');
                        const embed = new EmbedBuilder()
                            .setColor(0xFFD700)
                            .setTitle(`Image générée pour : "${prompt.substring(0, 250)}"`)
                            .setImage(`attachment://generated_image.png`);
                        await interaction.editReply({ embeds: [embed], files: [{ attachment: imageBuffer, name: 'generated_image.png' }] });
                    } else {
                        await interaction.editReply({ content: '❌ La génération d\'image a échoué. Votre demande a peut-être été bloquée par les filtres de sécurité.' });
                    }
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
