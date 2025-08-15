
import { Events, Message, PartialMessage, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.MessageDelete;

export async function execute(message: Message | PartialMessage) {
    if (!message.guild) return;

    const config = await getServerConfig(message.guild.id, 'logs');
    if (!config?.enabled || !config['log-messages'] || !config.log_channel_id) return;
    
    // Check for exemptions
    if (message.author?.id && (message.member?.roles.cache.some(r => config.exempt_roles.includes(r.id)))) return;
    if (config.exempt_channels.includes(message.channel.id)) return;

    if (message.author?.bot) return; // Also ignore bots after checking exemptions in case a bot has an exempt role

    const logChannel = await message.guild.channels.fetch(config.log_channel_id).catch(() => null) as TextChannel;
    if (!logChannel || logChannel.id === message.channel.id) return;

    const embed = new EmbedBuilder()
        .setColor(0xFF470F) // Orange
        .setTitle('Message Supprimé')
        .setDescription(`Un message de **${message.author?.tag || 'Auteur inconnu'}** a été supprimé dans <#${message.channel.id}>.`)
        .addFields(
            { name: 'Contenu', value: message.content ? `\`\`\`${message.content.substring(0, 1020)}\`\`\`` : 'Impossible de récupérer le contenu (message partiel ou embed).', inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `Auteur ID: ${message.author?.id} | Message ID: ${message.id}` });

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de suppression de message pour le serveur ${message.guild.id}:`, error);
    }
}
