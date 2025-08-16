
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

    if (!oldChannel && newChannel) {
        // User joined a voice channel
        embed
            .setColor(0x2ECC71) // Green
            .setDescription(`${member.user.toString()} a rejoint le salon vocal **${newChannel.name}**.`);
    } else if (oldChannel && !newChannel) {
        // User left a voice channel
        embed
            .setColor(0xE74C3C) // Red
            .setDescription(`${member.user.toString()} a quitté le salon vocal **${oldChannel.name}**.`);
    } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
        // User switched voice channels
        embed
            .setColor(0x3498DB) // Blue
            .setDescription(`${member.user.toString()} a changé de salon vocal.`)
            .addFields(
                { name: 'Ancien salon', value: oldChannel.name, inline: true },
                { name: 'Nouveau salon', value: newChannel.name, inline: true }
            );
    } else {
        // Other voice state update (mute, deafen, etc.) - can be implemented later
        return;
    }

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de statut vocal pour le serveur ${guild.id}:`, error);
    }
}
