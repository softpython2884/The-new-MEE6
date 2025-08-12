
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, TextChannel, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';

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
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        await interaction.deferReply({ ephemeral: true });

        const config = await getServerConfig(interaction.guild.id, 'lock');
        if (!config?.enabled) {
            await interaction.editReply({ content: "Le module de verrouillage est désactivé sur ce serveur." });
            return;
        }
        
        // TODO: Check for command permissions from config

        const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
        const everyoneRole = interaction.guild.roles.everyone;

        try {
            // Check if channel is actually locked
             const currentPermissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
            if (!currentPermissions || !currentPermissions.deny.has(PermissionFlagsBits.SendMessages)) {
                 await interaction.editReply({ content: `Le salon ${channel} n'est pas verrouillé.` });
                 return;
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                [PermissionFlagsBits.SendMessages]: null, // null restores the default permission
            });

            await interaction.editReply({ content: `Le salon ${channel} a été déverrouillé.` });
            await channel.send(`🔓 **Salon déverrouillé** par ${interaction.user.toString()}.`);

        } catch (error) {
            console.error('Erreur lors du déverrouillage du salon:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors du déverrouillage du salon.' });
        }
    },
};

export default UnlockCommand;
