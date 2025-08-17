

'use server';

import { Events, VoiceState, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.VoiceStateUpdate;

export async function execute(oldState: VoiceState, newState: VoiceState) {
    const { member, guild } = newState;
    if (!member || !guild) return;

    const config = await getServerConfig(guild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.voice?.enabled) return;

    const targetChannelId = config.log_settings.voice.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await guild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    const embed = new EmbedBuilder()
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setTimestamp()
        .setFooter({ text: `ID: ${member.id}` });
    
    let logSent = false;

    // User joins/leaves/switches channel
    if (oldChannel?.id !== newChannel?.id) {
        if (!oldChannel && newChannel) {
            embed.setColor(0x2ECC71).setDescription(`${member.user.toString()} a rejoint le salon vocal **${newChannel.name}**.`);
        } else if (oldChannel && !newChannel) {
            embed.setColor(0xE74C3C).setDescription(`${member.user.toString()} a quitté le salon vocal **${oldChannel.name}**.`);
        } else if (oldChannel && newChannel) {
            embed.setColor(0x3498DB).setDescription(`${member.user.toString()} a changé de salon vocal.`)
                 .addFields(
                     { name: 'Ancien salon', value: oldChannel.name, inline: true },
                     { name: 'Nouveau salon', value: newChannel.name, inline: true }
                 );
        }
    } 
    // User mute/deafen/stream status change
    else {
        if (oldState.serverMute !== newState.serverMute) {
            embed.setColor(newState.serverMute ? 0xFFA500 : 0x738ADB)
                 .setDescription(`${member.user.toString()} a été rendu ${newState.serverMute ? 'muet' : 'non muet'} par un modérateur dans **${newChannel?.name}**.`);
        } else if (oldState.serverDeaf !== newState.serverDeaf) {
             embed.setColor(newState.serverDeaf ? 0xFFA500 : 0x738ADB)
                 .setDescription(`${member.user.toString()} a été rendu ${newState.serverDeaf ? 'sourd' : 'non sourd'} par un modérateur dans **${newChannel?.name}**.`);
        } else if (oldState.selfMute !== newState.selfMute) {
             embed.setColor(newState.selfMute ? 0xFFA500 : 0x738ADB)
                 .setDescription(`${member.user.toString()} a rendu son micro ${newState.selfMute ? 'muet' : 'actif'} dans **${newChannel?.name}**.`);
        } else if (oldState.selfDeaf !== newState.selfDeaf) {
             embed.setColor(newState.selfDeaf ? 0xFFA500 : 0x738ADB)
                 .setDescription(`${member.user.toString()} a rendu son casque ${newState.selfDeaf ? 'muet' : 'actif'} dans **${newChannel?.name}**.`);
        } else if (oldState.streaming !== newState.streaming) {
             embed.setColor(newState.streaming ? 0x5865F2 : 0x99AAB5)
                 .setDescription(`${member.user.toString()} a ${newState.streaming ? 'commencé' : 'arrêté'} un stream dans **${newChannel?.name}**.`);
        } else {
            return; // No loggable change
        }
    }


    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de statut vocal pour le serveur ${guild.id}:`, error);
    }
}
