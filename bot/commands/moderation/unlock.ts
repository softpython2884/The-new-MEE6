
import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, ChannelType, TextChannel, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../../src/types';

const UnlockCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Déverrouille un salon précédemment verrouillé.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Le salon à déverrouiller. Par défaut, le salon actuel.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        // TODO: First, check if the module is enabled for this server
        // const config = await db.getServerConfig(interaction.guildId);
        // if (!config.modules.lock.enabled) {
        //     await interaction.reply({ content: "Le module de verrouillage est désactivé sur ce serveur.", ephemeral: true });
        //     return;
        // }
        
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', ephemeral: true });
            return;
        }

        const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
        const everyoneRole = interaction.guild.roles.everyone;

        try {
            // TODO: Here, you would fetch the saved permissions from your database and restore them.
            // For example: const savedPermissions = await db.getPermissions(channel.id);
            // await channel.permissionOverwrites.set(savedPermissions);
            // await db.deletePermissions(channel.id);
            
            // For now, we'll just restore the SendMessages permission for @everyone.
            // A real implementation would restore the exact previous state.
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null, // null restores the default permission
            });

            await interaction.reply({ content: `Le salon ${channel} a été déverrouillé.` });

        } catch (error) {
            console.error('Erreur lors du déverrouillage du salon:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors du déverrouillage du salon.', ephemeral: true });
        }
    },
};

export default UnlockCommand;
