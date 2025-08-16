
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';

const JoinCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Fait rejoindre le bot dans votre salon vocal.')
        .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply({ content: 'Vous devez être dans un salon vocal pour utiliser cette commande.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'manual-voice-control');
        if (!config?.enabled) {
            await interaction.reply({ content: 'Le module de contrôle vocal est désactivé.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        // TODO: Add permission check based on config.command_permissions.join

        try {
            await interaction.deferReply({ ephemeral: true });

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
            
            await interaction.editReply(`J'ai rejoint le salon **${voiceChannel.name}** !`);

        } catch (error) {
            console.error('[JoinCommand] Error joining voice channel:', error);
            await interaction.editReply({ content: 'Je n\'ai pas pu rejoindre votre salon vocal. Vérifiez mes permissions !' });
        }
    },
};

export default JoinCommand;
