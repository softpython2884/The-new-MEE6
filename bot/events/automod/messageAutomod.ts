

import { Events, Message, Collection } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

// --- Anti-Spam Cache ---
// Maps a user ID to a collection of message timestamps
const userMessageCache = new Collection<string, number[]>();
const SPAM_THRESHOLD = 5; // 5 messages
const SPAM_TIMEFRAME = 5000; // in 5 seconds


const discordInviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9-]{2,32}/i;
const urlRegex = /(https?:\/\/[^\s]+)/g;
// Regex to count Unicode emojis. It's complex due to emoji variations.
const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;


export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (!message.guild || message.author.bot) return;

    const autoModConfig = await getServerConfig(message.guild.id, 'auto-moderation');
    if (!autoModConfig?.enabled) return;
    
    // Check if channel is in the scanned list. If list is empty, don't scan anything.
    const scannedChannels = (autoModConfig.scanned_channels as string[]) || [];
    if (scannedChannels.length === 0 || !scannedChannels.includes(message.channel.id)) {
        return;
    }

    // Check for exempt roles for Auto-Mod
    const exemptRoles = (autoModConfig.exempt_roles as string[]) || [];
    if (message.member && message.member.roles.cache.some(role => exemptRoles.includes(role.id))) {
        return;
    }

    const rules = autoModConfig;

    // --- Rule: Forbidden Vocabulary ---
    if (rules.forbidden_vocabulary_enabled) {
        const forbiddenWords = (rules.forbidden_vocabulary_words as string[]) || [];
        const forbiddenWord = forbiddenWords.find(word => message.content.toLowerCase().includes(word.toLowerCase()));
        if (forbiddenWord) {
            await handleAction(message, 'forbidden_vocabulary', rules.forbidden_vocabulary_action as string, `l'utilisation de termes interdits ("${forbiddenWord}")`);
            return; // Stop processing after first violation
        }
    }
    
    // --- Rule: Discord Invites ---
    if (rules.discord_invites_enabled && discordInviteRegex.test(message.content)) {
        await handleAction(message, 'discord_invites', rules.discord_invites_action as string, `les invitations Discord ne sont pas autorisées.`);
        return; 
    }

    // --- Rule: External Links (from Auto-Mod) ---
    if (rules.external_links_enabled) {
        const allowedDomains = (rules.external_links_allowed_domains as string[]) || [];
        const links = message.content.match(urlRegex);
        if (links) {
            const hasForbiddenLink = links.some(link => {
                // Ignore discord invites as they are handled by another rule
                if (discordInviteRegex.test(link)) return false;
                try {
                    const url = new URL(link);
                    // Check if the link's hostname or its subdomains are NOT included in the allowed domains.
                    return !allowedDomains.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain));
                } catch (e) {
                    // Invalid URL, treat as a forbidden link for safety
                    return true;
                }
            });
            if (hasForbiddenLink) {
                 await handleAction(message, 'external_links', rules.external_links_action as string, `l'envoi de liens externes non autorisés.`);
                 return;
            }
        }
    }

    // --- Rule: Link Scanner (from Anti-Raid) ---
    const antiRaidConfig = await getServerConfig(message.guild.id, 'adaptive-anti-raid');
    if (antiRaidConfig?.enabled && antiRaidConfig.link_scanner_enabled && antiRaidConfig.premium) {
        const links = message.content.match(urlRegex);
        if (links) {
            // In a real scenario, this would check against a list of malicious domains.
            // For now, any link triggers the action if the main 'external_links' rule from automod is disabled.
            if (!rules.external_links_enabled) {
                await handleAction(message, 'link_scanner', antiRaidConfig.link_scanner_action, `le lien a été jugé suspect par le scanner automatique.`);
                return;
            }
        }
    }

    // --- Rule: Excessive Caps ---
    if (rules.excessive_caps_enabled) {
        const content = message.content.replace(/[^a-zA-Z]/g, ''); // Only consider letters
        if (content.length > 10) { // Don't check short messages
            const upperCaseCount = (content.match(/[A-Z]/g) || []).length;
            const capsPercentage = (upperCaseCount / content.length) * 100;
            const threshold = (rules.excessive_caps_threshold_percentage as number) || 70;
            if (capsPercentage > threshold) {
                await handleAction(message, 'excessive_caps', rules.excessive_caps_action as string, `l'utilisation excessive de majuscules (${Math.round(capsPercentage)}%).`);
                return;
            }
        }
    }

    // --- Rule: Excessive Emojis ---
    if (rules.excessive_emojis_enabled) {
        const emojiCount = (message.content.match(emojiRegex) || []).length;
        const maxEmojis = (rules.excessive_emojis_max_emojis as number) || 10;
        if (emojiCount > maxEmojis) {
            await handleAction(message, 'excessive_emojis', rules.excessive_emojis_action as string, `l'utilisation excessive d'émojis (${emojiCount}).`);
            return;
        }
    }

    // --- Rule: Excessive Mentions ---
    if (rules.excessive_mentions_enabled) {
        const totalMentions = message.mentions.users.size + message.mentions.roles.size;
        const maxMentions = (rules.excessive_mentions_max_mentions as number) || 5;
        if (totalMentions > maxMentions) {
            await handleAction(message, 'excessive_mentions', rules.excessive_mentions_action as string, `la mention excessive d'utilisateurs ou de rôles (${totalMentions}).`);
            return;
        }
    }
    
    // --- Rule: Message Spam ---
    if (rules.message_spam_enabled) {
        const now = Date.now();
        const userMessages = userMessageCache.get(message.author.id) || [];
        
        // Filter out old messages
        const recentMessages = userMessages.filter(timestamp => now - timestamp < SPAM_TIMEFRAME);
        recentMessages.push(now);
        userMessageCache.set(message.author.id, recentMessages);

        if (recentMessages.length > SPAM_THRESHOLD) {
            await handleAction(message, 'message_spam', rules.message_spam_action as string, `le spam de messages.`);
            // Clear cache for this user after flagging them
            userMessageCache.delete(message.author.id);
            return;
        }
    }
}


async function handleAction(message: Message, ruleName: string, action: string, reason: string) {
     console.log(`[Automod] Rule triggered: ${ruleName} by ${message.author.tag} in ${message.guild?.name}. Action: ${action}.`);
     
     const sendWarning = async (warningMessage: string) => {
        try {
            const reply = await message.channel.send(warningMessage);
            // Delete warning after a few seconds to keep chat clean
            setTimeout(() => reply.delete().catch(console.error), 7000);
        } catch (err) {
            console.error(`[Automod] Failed to send warning for rule ${ruleName}:`, err);
        }
     };

     switch (action) {
         case 'delete':
            try {
                await message.delete();
                await sendWarning(`> **${message.author.toString()}, votre message a été supprimé car il enfreint une règle : ${reason}**`);
            } catch (error) {
                console.error(`[Automod] Could not delete message for rule ${ruleName}:`, error);
            }
            break;

        case 'warn':
             await sendWarning(`> **${message.author.toString()}, attention, votre message enfreint une règle : ${reason}**`);
            break;
            
        case 'mute':
            try {
                // Attempt to mute the user
                const member = await message.guild?.members.fetch(message.author.id);
                if (member && member.moderatable) {
                    // Mute for 5 minutes as a default spam punishment
                    await member.timeout(5 * 60 * 1000, `AutoMod: ${ruleName}`); 
                    await sendWarning(`> **${message.author.toString()}, vous avez été rendu muet pour avoir enfreint la règle : ${reason}**`);
                    await message.delete(); // Also delete the offending message
                } else {
                     throw new Error('Member not found or cannot be muted.');
                }
            } catch(e) {
                console.error(`[Automod] Failed to apply mute for ${message.author.tag}:`, e);
                // Fallback to delete if mute fails (e.g. permissions)
                await message.delete().catch(console.error);
                await sendWarning(`> **${message.author.toString()}, votre message a été supprimé car il enfreint une règle : ${reason}**`);
            }
            break;
     }
}
