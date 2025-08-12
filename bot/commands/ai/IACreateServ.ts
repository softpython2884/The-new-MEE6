

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';


const IACreateServCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('iacreateserv')
        .setDescription('Génère une structure de serveur complète avec l\'IA.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('theme')
                .setDescription('Le thème de base pour la génération du serveur.')
                .setRequired(true)
                .addChoices(
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'Professionnel', value: 'pro' },
                    { name: 'Roleplay', value: 'rp' },
                    { name: 'Communauté', value: 'community' },
                    { name: 'Streaming', value: 'stream' }
                ))
        .addStringOption(option =>
            option.setName('detail_level')
                .setDescription('Le niveau de détail de la structure à générer.')
                .setRequired(false)
                 .addChoices(
                    { name: 'Minimal', value: 'minimal' },
                    { name: 'Standard', value: 'standard' },
                    { name: 'Complet', value: 'full' }
                )),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const serverBuilderConfig = await getServerConfig(interaction.guild.id, 'server-builder');

        if (!serverBuilderConfig?.enabled) {
            await interaction.reply({ content: "Le module Server Builder IA est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        const theme = interaction.options.getString('theme', true);
        const detailLevel = interaction.options.getString('detail_level') || 'standard';

        // TODO: In a real implementation, you would:
        // 1. Call a Genkit flow with the theme and detail level.
        // 2. The flow would return a JSON object describing the entire server structure (categories, channels, roles, permissions).
        // 3. The bot would then parse this JSON and use the Discord.js API to create everything.
        //    - This is a very complex and potentially long-running task.
        //    - It would require careful handling of rate limits.
        //    - It should probably be done in a way that can be resumed if it fails.
        // 4. For now, we defer the reply and send a confirmation message.

        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🚀 Lancement du Server Builder IA')
            .setDescription(`La génération de votre serveur sur le thème **${theme}** avec un niveau de détail **${detailLevel}** a commencé.`)
            .addFields({ name: 'Progression', value: 'Cela peut prendre plusieurs minutes. Vous serez notifié lorsque ce sera terminé.' })
            .setFooter({ text: 'Implémentation de la génération par IA à venir.' });
            
        await interaction.editReply({ embeds: [embed] });
    },
};

export default IACreateServCommand;
