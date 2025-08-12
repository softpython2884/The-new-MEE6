

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

    const config = await getServerConfig(message.guild.id, 'auto-moderation');
    if (!config?.enabled) return;
    
    // Check for exempt roles
    const exemptRoles = (config.exempt_roles as string[]) || [];
    if (message.member && message.member.roles.cache.some(role => exemptRoles.includes(role.id))) {
        return;
    }

    const rules = config;

    // --- Rule: Forbidden Vocabulary ---
    if (rules.forbidden_vocabulary_enabled) {
        const forbiddenWords = (rules.forbidden_vocabulary_words as string[]) || [];
        const forbiddenWord = forbiddenWords.find(word => message.content.toLowerCase().includes(word));
        if (forbiddenWord) {
            await handleAction(message, 'forbidden_vocabulary', rules.forbidden_vocabulary_action as string, `l'utilisation de termes interdits.`);
            return;
        }
    }
    
    // --- Rule: Discord Invites ---
    if (rules.discord_invites_enabled && discordInviteRegex.test(message.content)) {
        await handleAction(message, 'discord_invites', rules.discord_invites_action as string, `les invitations Discord ne sont pas autorisées.`);
        return; 
    }

    // --- Rule: External Links ---
    if (rules.external_links_enabled) {
        const allowedDomains = (rules.external_links_allowed_domains as string[]) || [];
        const links = message.content.match(urlRegex);
        if (links && links.some(link => !allowedDomains.some(domain => new URL(link).hostname.includes(domain)))) {
             await handleAction(message, 'external_links', rules.external_links_action as string, `les liens externes non autorisés.`);
             return;
        }
    }

    // --- Rule: Excessive Caps ---
    if (rules.excessive_caps_enabled) {
        const content = message.content.replace(/[^a-zA-Z]/g, ''); // Only consider letters
        if (content.length > 10) { // Don't check short messages
            const upperCaseCount = (content.match(/[A-Z]/g) || []).length;
            const capsPercentage = (upperCaseCount / content.length) * 100;
            if (capsPercentage > (rules.excessive_caps_threshold_percentage as number)) {
                await handleAction(message, 'excessive_caps', rules.excessive_caps_action as string, `l'utilisation excessive de majuscules.`);
                return;
            }
        }
    }

    // --- Rule: Excessive Emojis ---
    if (rules.excessive_emojis_enabled) {
        const emojiCount = (message.content.match(emojiRegex) || []).length;
        if (emojiCount > (rules.excessive_emojis_max_emojis as number)) {
            await handleAction(message, 'excessive_emojis', rules.excessive_emojis_action as string, `l'utilisation excessive d'émojis.`);
            return;
        }
    }

    // --- Rule: Excessive Mentions ---
    if (rules.excessive_mentions_enabled) {
        const totalMentions = message.mentions.users.size + message.mentions.roles.size;
        if (totalMentions > (rules.excessive_mentions_max_mentions as number)) {
            await handleAction(message, 'excessive_mentions', rules.excessive_mentions_action as string, `la mention excessive d'utilisateurs ou de rôles.`);
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

    // TODO: Implement other rules
    // --- Rule: Forbidden Pings ---
    // --- Rule: Forbidden Markdown ---
}


async function handleAction(message: Message, ruleName: string, action: string, reason: string) {
     console.log(`[Automod] Rule triggered: ${ruleName} by ${message.author.tag} in ${message.guild?.name}. Action: ${action}.`);
     
     switch (action) {
         case 'delete':
            try {
                await message.delete();
                const reply = await message.channel.send({
                    content: `> **${message.author.toString()}, votre message a été supprimé car il enfreint une règle : ${reason}**`,
                });
                setTimeout(() => reply.delete().catch(console.error), 7000);
            } catch (error) {
                console.error(`[Automod] Could not delete message for rule ${ruleName}:`, error);
            }
            break;

        case 'warn':
             try {
                const reply = await message.channel.send({
                    content: `> **${message.author.toString()}, attention, votre message enfreint une règle : ${reason}**`,
                });
                 // Maybe also DM the user or add to a database warning system
            } catch (error) {
                console.error(`[Automod] Could not send warning for rule ${ruleName}:`, error);
            }
            break;
            
        case 'mute':
            // Muting is more complex. It would involve using the /mute command logic,
            // applying a timeout, and logging the action.
            // For now, we'll just log it.
            console.log(`[Automod] Mute action triggered for ${message.author.tag} due to ${ruleName}. Implementation needed.`);
             try {
                const reply = await message.channel.send({
                    content: `> **${message.author.toString()}, vous avez été rendu muet pour avoir enfreint la règle : ${reason}**`,
                });
                // In a real implementation, you would apply timeout here.
            } catch (error) {
                console.error(`[Automod] Could not send mute message for rule ${ruleName}:`, error);
            }
            break;
     }
}
