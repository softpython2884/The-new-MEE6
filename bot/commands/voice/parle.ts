
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';
import { ttsFlow } from '@/ai/flows/tts-flow';
import { Readable } from 'stream';

const ParleCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('parle')
        .setDescription('Fait parler le bot dans le salon vocal.')
        .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)
        .addStringOption(option => 
            option.setName('texte')
                .setDescription('Le texte que le bot doit dire.')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'manual-voice-control');
        if (!config?.enabled) {
            await interaction.reply({ content: 'Le module de contrôle vocal est désactivé.', flags: MessageFlags.Ephemeral });
            return;
        }

        let connection = getVoiceConnection(interaction.guild.id);
        
        // If not in a channel, try to join the user's channel
        if (!connection) {
             const voiceChannel = interaction.member.voice.channel;
             if (!voiceChannel) {
                await interaction.reply({ content: 'Je ne suis dans aucun salon vocal, et vous non plus. Rejoignez-en un d\'abord !', flags: MessageFlags.Ephemeral });
                return;
            }
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
        }


        const textToSpeak = interaction.options.getString('texte', true);
        await interaction.deferReply({ ephemeral: true });

        try {
            const { audioDataUri } = await ttsFlow({ text: textToSpeak });
            
            const audioBuffer = Buffer.from(audioDataUri.split(',')[1], 'base64');
            const audioStream = new Readable();
            audioStream.push(audioBuffer);
            audioStream.push(null);

            const player = createAudioPlayer();
            const resource = createAudioResource(audioStream);
            
            connection.subscribe(player);
            player.play(resource);
            
            player.on(AudioPlayerStatus.Idle, () => {
                // Optional: Disconnect after speaking
                // connection?.destroy();
                try {
                    player.stop();
                } catch(e) {
                    console.error("Error stopping player", e);
                }
            });

            await interaction.editReply('🔊 Je parle...');

        } catch (error) {
            console.error('[ParleCommand] Error during TTS or playback:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la génération de la voix.' });
        }
    },
};

export default ParleCommand;
