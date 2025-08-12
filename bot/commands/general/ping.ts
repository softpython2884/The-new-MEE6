
import { SlashCommandBuilder, CommandInteraction, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const PingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Vérifie la latence du bot.'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guildId) {
             await interaction.editReply({ content: "Une erreur est survenue." });
             return;
        }
        
        const config = await getServerConfig(interaction.guildId, 'general-commands');
        if (!config?.command_enabled?.ping) {
            await interaction.editReply({ content: "Cette commande est désactivée sur ce serveur." });
            return;
        }

        // TODO: Check for role permissions from config.command_permissions.ping
        await interaction.editReply('Pinging...');
        const reply = await interaction.fetchReply();
        const latency = reply.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        await interaction.editReply(`Pong! Latence du bot : ${latency}ms. Latence de l'API : ${apiLatency}ms.`);
    },
};

export default PingCommand;
