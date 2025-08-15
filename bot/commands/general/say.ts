
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags, TextChannel } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const SayCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Fait parler le bot dans le salon actuel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le message que le bot doit envoyer.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'general-commands');
        if (!config?.command_enabled?.say) {
            await interaction.reply({ content: "Cette commande est désactivée sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        const message = interaction.options.getString('message', true);

        try {
            await (interaction.channel as TextChannel).send(message);
            await interaction.reply({ content: 'Message envoyé !', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('[SayCommand] Error sending message:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'envoi du message.', flags: MessageFlags.Ephemeral });
        }
    },
};

export default SayCommand;
