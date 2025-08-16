
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';

const LeaveCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Fait quitter le bot de son salon vocal.')
        .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const connection = getVoiceConnection(interaction.guild.id);
        if (!connection) {
            await interaction.reply({ content: 'Je ne suis dans aucun salon vocal sur ce serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'manual-voice-control');
        if (!config?.enabled) {
            await interaction.reply({ content: 'Le module de contrôle vocal est désactivé.', flags: MessageFlags.Ephemeral });
            return;
        }

        // TODO: Add permission check based on config.command_permissions.leave
        
        try {
            connection.destroy();
            await interaction.reply({ content: 'J\'ai quitté le salon vocal.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('[LeaveCommand] Error leaving voice channel:', error);
            await interaction.reply({ content: 'Une erreur est survenue en essayant de quitter le salon.', flags: MessageFlags.Ephemeral });
        }
    },
};

export default LeaveCommand;
