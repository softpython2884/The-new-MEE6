
'use server';

import { Events, Message, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

const linkRegex = /https?:\/\/[^\s]+/gi;

export const name = Events.MessageCreate;

export async function execute(message: Message) {
    if (!message.guild || message.author.bot || !message.member) return;

    const config = await getServerConfig(message.guild.id, 'adaptive-anti-raid');
    const isPremium = config?.premium || false;

    if (!config?.enabled || !config.link_scanner_enabled || !isPremium) {
        return;
    }

    const links = message.content.match(linkRegex);
    if (!links || links.length === 0) {
        return;
    }
    
    // TODO: A more advanced implementation would use a safe browsing API to check link reputation.
    // For now, we assume any link is a potential threat if the module is active.

    // Check for exempt roles
    const exemptRoles = config.exempt_roles || [];
     if (message.member.roles.cache.some(role => exemptRoles.includes(role.id))) {
        return;
    }

    console.log(`[Link-Scanner] Detected link(s) from ${message.author.tag} in ${message.guild.name}. Action: ${config.link_scanner_action}`);
    
    // Alert moderators
    if (config.alert_channel_id) {
        const alertChannel = await message.guild.channels.fetch(config.alert_channel_id as string).catch(() => null) as TextChannel;
        if (alertChannel) {
             const embed = new EmbedBuilder()
                .setColor(0xFFA500) // Orange
                .setTitle('🚨 Alerte Scanner de Liens 🚨')
                .setDescription(`Un lien a été détecté dans un message de ${message.author.toString()} dans ${message.channel.toString()}.`)
                .addFields(
                    { name: 'Contenu du Message', value: `\`\`\`${message.content.substring(0, 1000)}\`\`\`` },
                    { name: 'Action entreprise', value: `\`${config.link_scanner_action}\``, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `ID Utilisateur: ${message.author.id}` });
            
            await alertChannel.send({ embeds: [embed] });
        }
    }

    // Take action
    if (config.link_scanner_action === 'delete') {
        try {
            await message.delete();
            const replyMsg = await message.channel.send(`> **${message.author.toString()}, votre message a été supprimé car les liens ne sont pas autorisés.**`);
            setTimeout(() => replyMsg.delete().catch(() => {}), 10000);
        } catch (error: any) {
            if (error.code !== 10008) { // Ignore "Unknown Message" error
                console.error(`[Link-Scanner] Failed to delete message ${message.id}:`, error);
            }
        }
    } else if (config.link_scanner_action === 'warn') {
        // Just send the alert, which is already done.
    }
}
