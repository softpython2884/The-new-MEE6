
import { Events, Message, TextChannel } from 'discord.js';
import { getServerConfig } from '../../src/lib/db';
import { autoTranslateFlow } from '../../src/ai/flows/auto-translate-flow';

export const name = Events.MessageCreate;
export const once = false;

const WEBHOOK_NAME = "Marcus Translator";

async function handleAutoTranslate(message: Message) {
    if (!message.guild || message.author.bot || !message.content) return;

    const config = await getServerConfig(message.guild.id, 'auto-translation');
    const isPremium = config?.premium || false;

    if (!config?.enabled || !isPremium || !config.channels.includes(message.channel.id)) {
        return;
    }

    try {
        const result = await autoTranslateFlow({
            textToTranslate: message.content,
            targetLanguage: 'French', // Or make this configurable in the panel
        });

        if (result.translationNeeded && result.translatedText) {
            const targetChannel = message.channel as TextChannel;
            
            const embed = {
                color: 0x3498DB, // Blue
                description: `**Traduction :** ${result.translatedText}`,
                footer: {
                    text: `Message original de ${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL(),
                },
            };

            if (config.mode === 'inline') {
                await message.reply({ embeds: [embed] });
            } else if (config.mode === 'replace') {
                // Delete original message
                await message.delete();
                
                // Find or create a webhook
                const webhooks = await targetChannel.fetchWebhooks();
                let webhook = webhooks.find(wh => wh.name === WEBHOOK_NAME && wh.token !== null);

                if (!webhook) {
                    webhook = await targetChannel.createWebhook({
                        name: WEBHOOK_NAME,
                        avatar: message.client.user?.displayAvatarURL(),
                        reason: 'Webhook pour la traduction automatique'
                    });
                }
                
                // Send message via webhook with user's identity
                await webhook.send({
                    content: result.translatedText,
                    username: message.member?.displayName || message.author.username,
                    avatarURL: message.author.displayAvatarURL(),
                });
            }
        }
    } catch (error) {
        console.error('[AutoTranslate] Error during translation flow:', error);
    }
}


async function handleAutoModeration(message: Message) {
    if (!message.guild || message.author.bot || !message.member) return;

    const config = await getServerConfig(message.guild.id, 'auto-moderation');
    if (!config?.enabled || !config.rules || config.rules.length === 0) {
        return;
    }

    const memberRoles = message.member.roles.cache.map(r => r.id);
    const channelId = message.channel.id;

    for (const rule of config.rules) {
        if (!rule.keywords || rule.keywords.length === 0) continue;

        // Check for exemptions
        const isRoleExempt = (rule.exempt_roles || []).some((roleId: string) => memberRoles.includes(roleId));
        if (isRoleExempt) continue;

        const isChannelExempt = (rule.exempt_channels || []).includes(channelId);
        if (isChannelExempt) continue;

        // Check for keyword matches
        const hasKeyword = rule.keywords.some((keyword: string) => message.content.toLowerCase().includes(keyword.toLowerCase()));

        if (hasKeyword) {
            console.log(`[AutoMod] Message de ${message.author.tag} déclenché la règle "${rule.name}"`);

            try {
                // Perform action
                if (rule.action === 'delete') {
                    await message.delete();
                }

                // Send warning/log
                const logChannelId = config.log_channel_id || message.channel.id;
                const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null) as TextChannel;
                
                if (logChannel) {
                    await logChannel.send(`> **Auto-Modération :** Le message de ${message.author.toString()} a été supprimé car il contenait un terme interdit par la règle "${rule.name}".`);
                }

            } catch (error) {
                console.error(`[AutoMod] Erreur lors de l'action pour la règle "${rule.name}":`, error);
            }
            
            // Stop processing further rules once one has been triggered
            return;
        }
    }
}


export async function execute(message: Message) {
    if (message.author.bot) return;

    // We do not await these promises, they can run in parallel
    // and we don't want one to block the other.
    handleAutoTranslate(message).catch(e => console.error("Error in handleAutoTranslate:", e));
    handleAutoModeration(message).catch(e => console.error("Error in handleAutoModeration:", e));
    
    return;
}
