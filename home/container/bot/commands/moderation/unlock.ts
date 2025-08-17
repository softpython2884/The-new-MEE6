

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, TextChannel, ChatInputCommandInteraction, MessageFlags, OverwriteResolvable } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig, unlockChannel } from '@/lib/db';

const UnlockCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Déverrouille un salon en restaurant ses permissions originales.')
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

        const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
        
        try {
            const originalPermissionsString = unlockChannel(channel.id);
            if (!originalPermissionsString) {
                 await interaction.editReply({ content: `Le salon ${channel} n'est pas verrouillé.` });
                 return;
            }
            
            const originalPermissions = JSON.parse(originalPermissionsString) as OverwriteResolvable[];

            await channel.permissionOverwrites.set(originalPermissions, `Salon déverrouillé par ${interaction.user.tag}`);

            await interaction.editReply({ content: `Le salon ${channel} a été déverrouillé et ses permissions originales ont été restaurées.` });
            await channel.send(`🔓 **Salon déverrouillé** par ${interaction.user.toString()}.`);

        } catch (error) {
            console.error('Erreur lors du déverrouillage du salon:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors du déverrouillage du salon.' });
        }
    },
};

export default UnlockCommand;
