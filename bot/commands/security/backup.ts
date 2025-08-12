

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import fetch from 'node-fetch';

const API_URL = process.env.BOT_API_URL || 'http://localhost:3001/api';


const BackupCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Gère les sauvegardes de la configuration du serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('export')
                .setDescription('Exporte la configuration actuelle du serveur (rôles, salons).'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('import')
                .setDescription('Importe une configuration de serveur depuis un fichier. ATTENTION: Action destructive.')
                .addAttachmentOption(option =>
                    option.setName('file')
                        .setDescription('Le fichier de sauvegarde (.json) à importer.')
                        .setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        await interaction.deferReply({ ephemeral: true });

        const config = await getServerConfig(interaction.guild.id, 'backup');
        if (!config?.enabled) {
            await interaction.editReply({ content: "Le module de backup est désactivé sur ce serveur." });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'export') {
            try {
                const response = await fetch(`${API_URL}/backup/${interaction.guild.id}/export`);
                if (!response.ok) {
                    throw new Error('Erreur de l\'API lors de la création de la sauvegarde.');
                }
                const backupData = await response.json();
                const backupString = JSON.stringify(backupData, null, 2);

                const attachment = new AttachmentBuilder(Buffer.from(backupString), {
                    name: `backup-${interaction.guild.name.replace(/\s/g, '_')}-${new Date().toISOString().split('T')[0]}.json`,
                });

                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('📄 Exportation Réussie')
                    .setDescription(`Voici la sauvegarde de la configuration de votre serveur. Conservez ce fichier précieusement.\nUtilisez \`/backup import\` pour restaurer cette configuration.`);

                await interaction.editReply({ embeds: [embed], files: [attachment] });

            } catch (error) {
                console.error('[Backup Export] Error:', error);
                await interaction.editReply({ content: 'Une erreur est survenue lors de l\'exportation.' });
            }
        } else if (subcommand === 'import') {
            const file = interaction.options.getAttachment('file', true);

            if (file.contentType !== 'application/json') {
                await interaction.editReply({ content: 'Fichier invalide. Veuillez fournir un fichier de sauvegarde .json valide.' });
                return;
            }
            
            // This is a placeholder. A real implementation is extremely complex and dangerous.
            // It would involve deleting all channels/roles and recreating them according to the JSON file,
            // while carefully handling permissions, positions, and rate limits.
            // This is too destructive to implement without heavy safeguards.
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('Importation en cours (Simulation)')
                .setDescription(`L'importation depuis le fichier **${file.name}** a commencé. Cette fonctionnalité est en cours de développement et simulée pour le moment. Aucune modification ne sera apportée au serveur.`)
                .setFooter({text: 'La fonctionnalité d\'importation réelle sera bientôt disponible.'});
            
            await interaction.editReply({ embeds: [embed] });
        }
    },
};

export default BackupCommand;
