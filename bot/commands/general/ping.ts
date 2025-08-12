
import { SlashCommandBuilder, CommandInteraction, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const PingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Vérifie la latence du bot.'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
             await interaction.reply({ content: "Une erreur est survenue.", flags: MessageFlags.Ephemeral });
             return;
        }
        
        const config = await getServerConfig(interaction.guildId, 'general-commands');
        if (!config?.command_enabled?.ping) {
            await interaction.reply({ content: "Cette commande est désactivée sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        // TODO: Check for role permissions from config.command_permissions.ping

        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        await interaction.editReply(`Pong! Latence du bot : ${latency}ms. Latence de l'API : ${apiLatency}ms.`);
    },
};

export default PingCommand;
