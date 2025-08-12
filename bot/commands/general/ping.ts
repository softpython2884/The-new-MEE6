
import { SlashCommandBuilder, CommandInteraction, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '@/types';

const PingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Vérifie la latence du bot.'),
    async execute(interaction: ChatInputCommandInteraction) {
        // TODO: Fetch configuration from database for this server (interaction.guildId)
        // const config = await db.getServerConfig(interaction.guildId);
        // if (!config.modules.commands.ping_cmd) {
        //     await interaction.reply({ content: "Cette commande est désactivée sur ce serveur.", ephemeral: true });
        //     return;
        // }

        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        await interaction.editReply(`Pong! Latence du bot : ${latency}ms. Latence de l'API : ${apiLatency}ms.`);
    },
};

export default PingCommand;
