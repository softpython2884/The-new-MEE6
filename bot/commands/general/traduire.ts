
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import { autoTranslateFlow } from '../../../src/ai/flows/auto-translate-flow';

const TraduireCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('traduire')
        .setDescription('Traduit un texte dans une langue spécifiée.')
        .addStringOption(option =>
            option.setName('langue')
                .setDescription('La langue dans laquelle traduire le texte.')
                .setRequired(true)
                .addChoices(
                    { name: 'Anglais', value: 'English' },
                    { name: 'Français', value: 'French' },
                    { name: 'Espagnol', value: 'Spanish' },
                    { name: 'Allemand', value: 'German' },
                    { name: 'Japonais', value: 'Japanese' },
                    { name: 'Chinois (Simplifié)', value: 'Chinese (Simplified)' },
                    { name: 'Russe', value: 'Russian' }
                ))
        .addStringOption(option =>
            option.setName('texte')
                .setDescription('Le texte à traduire.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guildId, 'general-commands');
        if (!config?.command_enabled?.traduire) {
            await interaction.reply({ content: 'Cette commande est désactivée sur ce serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const targetLanguage = interaction.options.getString('langue', true);
        let textToTranslate = interaction.options.getString('texte', true);

        try {
            const result = await autoTranslateFlow({
                textToTranslate,
                targetLanguage,
            });

            if (result.translatedText) {
                const embed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle(`Traduction en ${targetLanguage}`)
                    .addFields(
                        { name: 'Texte Original', value: `\`\`\`${textToTranslate.substring(0, 1020)}\`\`\`` },
                        { name: 'Traduction', value: `\`\`\`${result.translatedText.substring(0, 1020)}\`\`\`` }
                    )
                    .setFooter({ text: `Traduit par ${interaction.user.tag}` });

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ content: 'Le texte est déjà dans la langue cible ou une erreur est survenue.' });
            }

        } catch (error) {
            console.error('[TraduireCommand] Error executing autoTranslateFlow:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la traduction.' });
        }
    },
};

export default TraduireCommand;

    