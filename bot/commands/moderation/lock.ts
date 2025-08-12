
import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, ChannelType, TextChannel, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../../src/types';

const LockCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Verrouille un salon pour le rôle @everyone.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Le salon à verrouiller. Par défaut, le salon actuel.')
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

        // TODO: Fetch configuration from database for this server (interaction.guildId)
        // const exemptRoles = config.lock.exempt_roles;
        // For now, we assume no roles are exempt.

        try {
            // TODO: Here, you would ideally save the current permission overwrites to a database
            // before changing them, so you can restore them with /unlock.
            // For example: await db.savePermissions(channel.id, channel.permissionOverwrites.cache);
            
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
            });

            await interaction.reply({ content: `Le salon ${channel} a été verrouillé.` });

        } catch (error) {
            console.error('Erreur lors du verrouillage du salon:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors du verrouillage du salon.', ephemeral: true });
        }
    },
};

export default LockCommand;
