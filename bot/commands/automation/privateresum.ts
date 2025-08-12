

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';


const PrivateResumCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('privateresum')
        .setDescription('Génère un résumé IA d\'un salon privé avant son archivage.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
        // TODO: Add an option to specify the channel to summarize, or run it in the channel to be archived.

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', ephemeral: true });
            return;
        }

        const privateRoomsConfig = await getServerConfig(interaction.guild.id, 'private-rooms');

        if (!privateRoomsConfig?.enabled || !privateRoomsConfig.archive_summary) {
            await interaction.reply({ content: "La fonctionnalité de résumé IA pour les salons privés est désactivée.", ephemeral: true });
            return;
        }
        
        // TODO: In a real implementation, you would:
        // 1. Fetch the message history of the current/specified channel.
        // 2. Pass the history to a Genkit flow for summarization.
        // 3. Post the summary.
        // 4. Archive the channel.

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("Résumé IA")
            .setDescription(`📝 Un résumé IA de ce salon serait généré ici avant l'archivage. (Implémentation IA à venir)`);
            
        await interaction.reply({ embeds: [embed] });
    },
};

export default PrivateResumCommand;
