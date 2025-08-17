

import { Events, Guild, EmbedBuilder, TextChannel, AuditLogEvent, GuildFeature } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.GuildUpdate;

export async function execute(oldGuild: Guild, newGuild: Guild) {
    const config = await getServerConfig(newGuild.id, 'logs');
    if (!config?.enabled || !config.log_settings?.server?.enabled) return;

    const targetChannelId = config.log_settings.server.channel_id || config.main_channel_id;
    if (!targetChannelId) return;

    const logChannel = await newGuild.channels.fetch(targetChannelId).catch(() => null) as TextChannel;
    if (!logChannel) return;
    
    let executor = 'Inconnu';
    try {
        const auditLogs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 });
        const log = auditLogs.entries.first();
        if (log && (Date.now() - log.createdTimestamp < 5000)) { // Check if the log is recent
            executor = log.executor?.tag || 'Inconnu';
        }
    } catch (e) {
        console.warn(`[Log] Missing permissions to fetch audit logs on ${newGuild.name}`);
    }

    const embed = new EmbedBuilder()
        .setColor(0x00BFFF) // DeepSkyBlue
        .setTitle('Serveur Mis à Jour')
        .setTimestamp()
        .setFooter({ text: `Modifié par ${executor}` });

    let hasChanged = false;

    // Name change
    if (oldGuild.name !== newGuild.name) {
        embed.addFields({ name: 'Nom du Serveur', value: `\`${oldGuild.name}\` ➔ \`${newGuild.name}\``, inline: false });
        hasChanged = true;
    }
    
    // Icon change
    if (oldGuild.iconURL() !== newGuild.iconURL()) {
        embed.addFields({ name: 'Icône du Serveur', value: 'L\'icône a été changée.', inline: false });
        embed.setThumbnail(newGuild.iconURL({ size: 128 }));
        hasChanged = true;
    }
    
    // Banner change
    if (oldGuild.bannerURL() !== newGuild.bannerURL()) {
        embed.addFields({ name: 'Bannière du Serveur', value: 'La bannière a été changée.', inline: false });
        embed.setImage(newGuild.bannerURL({ size: 256 }));
        hasChanged = true;
    }
    
    // Vanity URL change
    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
         embed.addFields({ name: 'URL Personnalisée', value: `\`${oldGuild.vanityURLCode || 'Aucune'}\` ➔ \`${newGuild.vanityURLCode || 'Aucune'}\``, inline: false });
         hasChanged = true;
    }
    
    // Verification level change
    if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
        embed.addFields({ name: 'Niveau de Vérification', value: `\`${oldGuild.verificationLevel}\` ➔ \`${newGuild.verificationLevel}\``, inline: false });
        hasChanged = true;
    }

    if (!hasChanged) return;

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log de mise à jour du serveur ${newGuild.id}:`, error);
    }
}
