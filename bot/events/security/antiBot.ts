

import { Events, GuildMember, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, AuditLogEvent } from 'discord.js';
import { getServerConfig } from '@/lib/db';


export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
    // 1. Only act if the new member is a bot
    if (!member.user.bot) {
        return;
    }

    const antibotConfig = await getServerConfig(member.guild.id, 'anti-bot');

    // 2. Check if the module is enabled
    if (!antibotConfig?.enabled || antibotConfig.mode === 'off') {
        return;
    }
    
    // 3. Check if the bot is on the whitelist
    const whitelistedBots = (antibotConfig.whitelisted_bots as string[]) || [];
    if (whitelistedBots.includes(member.user.id)) {
        console.log(`[Anti-Bot] Whitelisted bot ${member.user.tag} joined ${member.guild.name}. No action taken.`);
        return;
    }

    // --- Execute logic based on the configured mode ---

    console.log(`[Anti-Bot] Non-whitelisted bot ${member.user.tag} joined ${member.guild.name}. Mode: ${antibotConfig.mode}`);

    if (antibotConfig.mode === 'auto-block' || antibotConfig.mode === 'whitelist-only') {
        try {
            await member.kick('Politique Anti-Bot : Ce bot n\'est pas sur la liste blanche.');
            // TODO: Log this action to the moderation log channel
            console.log(`[Anti-Bot] Kicked bot ${member.user.tag} from ${member.guild.name}.`);
        } catch (error) {
            console.error(`[Anti-Bot] Failed to kick bot ${member.user.tag}:`, error);
        }
        return;
    }

    if (antibotConfig.mode === 'approval-required') {
        if (!antibotConfig.approval_channel_id) {
            console.error(`[Anti-Bot] Approval mode is on but no approval channel is set for guild ${member.guild.id}.`);
            return;
        }

        const approvalChannel = await member.guild.channels.fetch(antibotConfig.approval_channel_id as string).catch(() => null) as TextChannel;
        if (!approvalChannel) {
            console.error(`[Anti-Bot] Approval channel with ID ${antibotConfig.approval_channel_id} not found.`);
            return;
        }

        // Try to find out who invited the bot
        let inviter = 'Inconnu';
        try {
            // Fetch the audit log for bot additions
            const auditLogs = await member.guild.fetchAuditLogs({
                type: AuditLogEvent.BotAdd,
                limit: 5
            });
            // Find the log entry for the bot that just joined
            const botAddLog = auditLogs.entries.find(entry => (entry.target as any).id === member.user.id);
            if (botAddLog && botAddLog.executor) {
                inviter = botAddLog.executor.tag;
            }
        } catch (error) {
            console.warn('[Anti-Bot] Could not fetch audit logs to find inviter:', error);
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFA500) // Orange
            .setTitle('Approbation de Bot Requise')
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`Le bot **${member.user.tag}** a été ajouté au serveur et nécessite une approbation manuelle.`)
            .addFields(
                { name: 'Bot', value: member.user.toString(), inline: true },
                { name: 'Ajouté par', value: inviter, inline: true },
                { name: 'ID du Bot', value: `\`${member.user.id}\``, inline: false }
            )
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_bot_${member.user.id}`)
                    .setLabel('Approuver')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`deny_bot_${member.user.id}`)
                    .setLabel('Refuser & Expulser')
                    .setStyle(ButtonStyle.Danger)
            );
        
        try {
            await approvalChannel.send({ embeds: [embed], components: [row] });
            // TODO: Implement the interaction handler for these buttons
        } catch (error) {
            console.error(`[Anti-Bot] Could not send approval message to channel ${approvalChannel.id}:`, error);
        }
    }
}
