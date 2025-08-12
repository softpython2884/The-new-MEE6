
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import { faqFlow } from '../../../src/ai/flows/faq-flow';

const FaqCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('faq')
        .setDescription("Pose une question à l'assistant communautaire.")
        .addStringOption(option => 
            option.setName('question')
                .setDescription('La question que vous voulez poser.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'community-assistant');

        if (!config?.enabled) {
            await interaction.reply({ content: "L'assistant communautaire est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        const question = interaction.options.getString('question', true);
        const knowledgeBase = config.knowledge_base || [];
        const confidenceThreshold = config.confidence_threshold || 75;

        if (knowledgeBase.length === 0) {
             await interaction.reply({ content: "Je n'ai pas encore de connaissances sur ce serveur. La base de connaissances est vide.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const result = await faqFlow({
                userQuestion: question,
                knowledgeBase: knowledgeBase,
                confidenceThreshold: confidenceThreshold,
            });

            if (result.isConfident) {
                const embed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle(`Réponse à : "${question}"`)
                    .setDescription(result.answer)
                    .setFooter({ text: `Basé sur la question : "${result.matchedQuestion}"`});
                await interaction.editReply({ embeds: [embed] });
            } else {
                 await interaction.editReply({ content: "Désolé, je ne suis pas sûr d'avoir la réponse à cette question. Essayez de reformuler ou contactez un modérateur." });
            }

        } catch (error) {
            console.error('[FaqCommand] Error executing faqFlow:', error);
            await interaction.editReply({ content: 'Une erreur est survenue en essayant de trouver une réponse.' });
        }
    },
};

export default FaqCommand;
