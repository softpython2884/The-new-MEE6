
import { Events, Message, EmbedBuilder, TextChannel } from 'discord.js';
import { moderationAiFlow } from '../../../src/ai/flows/moderation-ai-flow';
import { getServerConfig, getUserSanctionHistory, recordSanction } from '../../../src/lib/db';
import ms from 'ms';

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (!message.guild || message.author.bot || !message.content || !message.member) return;

    const modAiConfig = await getServerConfig(message.guild.id, 'moderation-ai');
    const isPremium = modAiConfig?.premium || false;

    if (!modAiConfig?.enabled || !isPremium) {
        return;
    }

    // Check for exempt roles
    const exemptRoles = modAiConfig.exempt_roles || [];
    if (message.member.roles.cache.some(role => exemptRoles.includes(role.id))) {
        return;
    }
    
    try {
        // Fetch context and history
        const lastMessages = await message.channel.messages.fetch({ limit: 5, before: message.id });
        const conversationContext = lastMessages.map(m => `${m.author.username}: ${m.content}`).reverse();
        const userSanctionHistory = getUserSanctionHistory(message.guild.id, message.author.id);


        const result = await moderationAiFlow({
            messageContent: message.content,
            userName: message.author.username,
            conversationContext: conversationContext,
            userSanctionHistory: userSanctionHistory,
            sensitivity: modAiConfig.sensitivity || 'medium',
        });

        if (result.isToxic) {
            console.log(`[Mod-AI] Toxic message detected from ${message.author.tag} in ${message.guild.name}. Reason: ${result.reason}, Severity: ${result.severity}, Action: ${result.suggestedAction}`);

            const actionKey = result.severity as keyof typeof modAiConfig.actions;
            const action = modAiConfig.actions[actionKey];

            // --- Alert moderators ---
            if (modAiConfig.alert_channel_id) {
                const alertChannel = await message.guild.channels.fetch(modAiConfig.alert_channel_id).catch(() => null) as TextChannel;
                if (alertChannel) {
                     const alertEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚨 Alerte Modération IA 🚨')
                        .setDescription(`L'IA a détecté un message potentiellement problématique de ${message.author.toString()} dans ${message.channel.toString()}.`)
                        .addFields(
                            { name: 'Contenu du Message', value: `\`\`\`${message.content}\`\`\`` },
                            { name: 'Raison Détectée', value: result.reason, inline: true },
                            { name: 'Sévérité', value: result.severity, inline: true },
                            { name: 'Action suggérée/prise', value: `\`${action}\``, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: `ID Utilisateur: ${message.author.id}` });
                    
                    let content = '';
                    if (modAiConfig.alert_role_id) {
                        content = `<@&${modAiConfig.alert_role_id}>`;
                    }
                    await alertChannel.send({ content: content, embeds: [alertEmbed] });
                }
            }
            
            // --- Take Action based on configuration for the detected severity ---
             // Delete the toxic message
            try {
                await message.delete();
            } catch(e: any) {
                if (e.code === 10008) { // Unknown Message
                    console.log(`[Mod-AI] Tried to delete a message that was already deleted: ${message.id}`);
                } else {
                    console.error(`[Mod-AI] Failed to delete message:`, e);
                }
            }
            
            // Apply sanction
            const member = await message.guild.members.fetch(message.author.id).catch(() => null);
            if (!member) return;

            let durationMs: number | undefined = undefined;

            switch (action) {
                case 'warn':
                    await message.channel.send(`> **${message.author.toString()}, attention.** Votre message a été jugé inapproprié. Raison : ${result.reason}.`).then(msg => {
                        setTimeout(() => msg.delete().catch(console.error), 10000);
                    });
                    recordSanction({
                        guild_id: message.guild.id,
                        user_id: member.id,
                        moderator_id: 'AUTOMOD_IA',
                        action_type: 'warn',
                        reason: `[IA] ${result.reason}`
                    });
                    break;
                case 'mute_5m':
                case 'mute_10m':
                case 'mute_1h':
                case 'mute_24h':
                    const durationStr = action.split('_')[1];
                    durationMs = ms(durationStr);
                    if (member.moderatable) {
                        await member.timeout(durationMs, `AutoMod IA: ${result.reason}`);
                        await message.channel.send(`> **${message.author.toString()} a été rendu muet.** Raison : ${result.reason}.`).then(msg => {
                            setTimeout(() => msg.delete().catch(console.error), 10000);
                        });
                        recordSanction({
                            guild_id: message.guild.id,
                            user_id: member.id,
                            moderator_id: 'AUTOMOD_IA',
                            action_type: 'mute',
                            reason: `[IA] ${result.reason}`,
                            duration_seconds: durationMs / 1000
                        });
                    }
                    break;
                case 'ban':
                    if (member.bannable) {
                        await member.ban({ reason: `AutoMod IA: ${result.reason}` });
                        await message.channel.send(`> **${message.author.toString()} a été banni.** Raison : ${result.reason}.`).then(msg => {
                            setTimeout(() => msg.delete().catch(console.error), 10000);
                        });
                        recordSanction({
                            guild_id: message.guild.id,
                            user_id: member.id,
                            moderator_id: 'AUTOMOD_IA',
                            action_type: 'ban',
                            reason: `[IA] ${result.reason}`
                        });
                    }
                    break;
            }
        }

    } catch (error) {
        console.error('[Mod-AI] Error during message analysis flow:', error);
    }
}
