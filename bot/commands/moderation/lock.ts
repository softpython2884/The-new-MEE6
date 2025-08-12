
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, TextChannel, ChatInputCommandInteraction, MessageFlags, OverwriteResolvable } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const LockCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Verrouille un salon pour le rôle @everyone.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Le salon à verrouiller. Par défaut, le salon actuel.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du verrouillage (affichée dans le salon).')
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        const config = await getServerConfig(interaction.guild.id, 'lock');
        if (!config?.enabled) {
            await interaction.reply({ content: "Le module de verrouillage est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        // TODO: Check for command permissions from config

        const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée.';
        const everyoneRole = interaction.guild.roles.everyone;

        try {
            // Check if channel is already locked for @everyone
            const currentPermissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
            if (currentPermissions && currentPermissions.deny.has('SendMessages')) {
                 await interaction.reply({ content: `Le salon ${channel} est déjà verrouillé.`, flags: MessageFlags.Ephemeral });
                 return;
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
            });

            await interaction.reply({ content: `Le salon ${channel} a été verrouillé.`, flags: MessageFlags.Ephemeral });
            await channel.send(`🔒 **Salon verrouillé** par ${interaction.user.toString()}.\nRaison : ${reason}`);

        } catch (error) {
            console.error('Erreur lors du verrouillage du salon:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors du verrouillage du salon.', flags: MessageFlags.Ephemeral });
        }
    },
};

export default LockCommand;
