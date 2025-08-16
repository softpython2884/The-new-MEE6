
import { Events, Message, EmbedBuilder, TextChannel } from 'discord.js';
import { moderationAiFlow } from '../../../src/ai/flows/moderation-ai-flow';
import { getServerConfig } from '../../../src/lib/db';
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
        const result = await moderationAiFlow({
            messageContent: message.content,
            sensitivity: modAiConfig.sensitivity || 'medium',
        });

        if (result.isToxic) {
            console.log(`[Mod-AI] Toxic message detected from ${message.author.tag} in ${message.guild.name}. Reason: ${result.reason}, Severity: ${result.severity}, Action: ${result.suggestedAction}`);

            const actionKey = result.severity as keyof typeof modAiConfig.actions;
            const action = modAiConfig.actions[actionKey];

            // Alert moderators
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
                            { name: 'Action Appliquée', value: `\`${action}\``, inline: true }
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
            
            // Apply sanction
            const member = await message.guild.members.fetch(message.author.id).catch(() => null);
            if (!member) return;

            // Always delete the toxic message
            await message.delete().catch(e => console.error(`[Mod-AI] Failed to delete message:`, e));

            switch (action) {
                case 'warn':
                    await message.channel.send(`> **${message.author.toString()}, attention.** Votre message a été jugé inapproprié. Raison : ${result.reason}.`).then(msg => {
                        setTimeout(() => msg.delete().catch(console.error), 10000);
                    });
                    break;
                case 'mute_5m':
                case 'mute_10m':
                case 'mute_1h':
                case 'mute_24h':
                    const durationStr = action.split('_')[1];
                    const durationMs = ms(durationStr);
                    if (member.moderatable) {
                        await member.timeout(durationMs, `AutoMod IA: ${result.reason}`);
                         await message.channel.send(`> **${message.author.toString()} a été rendu muet.** Raison : ${result.reason}.`).then(msg => {
                            setTimeout(() => msg.delete().catch(console.error), 10000);
                        });
                    }
                    break;
                case 'ban':
                    if (member.bannable) {
                        await member.ban({ reason: `AutoMod IA: ${result.reason}` });
                         await message.channel.send(`> **${message.author.toString()} a été banni.** Raison : ${result.reason}.`).then(msg => {
                            setTimeout(() => msg.delete().catch(console.error), 10000);
                        });
                    }
                    break;
            }
        }

    } catch (error) {
        console.error('[Mod-AI] Error during message analysis flow:', error);
    }
}
