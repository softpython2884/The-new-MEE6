

import { Events, Message, Collection, EmbedBuilder } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';
import { conversationalAgentFlow } from '../../../src/ai/flows/conversational-agent-flow';
import { faqFlow } from '../../../src/ai/flows/faq-flow';
import fetch from 'node-fetch';

const imageMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

// Cache to store conversation history for dedicated channels
const conversationHistory = new Collection<string, { user: string; content: string }[]>();
const HISTORY_LIMIT = 10; // Keep the last 10 messages

// Helper to convert image URL to data URI
async function imageUrlToDataUri(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !imageMimeTypes.includes(contentType)) {
        throw new Error('Invalid content type for image.');
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
}


async function handleFaqTrigger(message: Message) {
    if (!message.guild || message.author.bot || !message.content) return;

    const config = await getServerConfig(message.guild.id, 'community-assistant');
    if (!config?.enabled || !config.premium) {
        return;
    }

    const knowledgeBase = config.knowledge_base || [];
    if (knowledgeBase.length === 0) return;

    const matchedQuestion = knowledgeBase.find((item: { question: string, answer: string }) => 
        message.content.toLowerCase().includes(item.question.toLowerCase())
    );

    if (matchedQuestion) {
        try {
             const result = await faqFlow({
                userQuestion: message.content,
                knowledgeBase: knowledgeBase,
                confidenceThreshold: config.confidence_threshold || 75,
            });

            if (result.isConfident && result.answer) {
                 const embed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle(`Réponse à votre question`)
                    .setDescription(result.answer)
                    .setFooter({ text: `Basé sur la question : "${result.matchedQuestion}"`});
                await message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('[FaqTrigger] Error executing faqFlow:', error);
        }
    }
}


async function handleConversationalAgent(message: Message) {
    if (message.author.bot || !message.guild || !message.member) {
        return;
    }

    const config = await getServerConfig(message.guild.id, 'conversational-agent');

    if (!config?.enabled || !config.premium) {
        return;
    }
    
    const isMentioned = message.mentions.has(message.client.user.id);
    const isInDedicatedChannel = message.channel.id === config.dedicated_channel_id;

    if (!isMentioned && !isInDedicatedChannel) {
        return;
    }

    const userMessage = message.content.replace(/<@!?\d+>/, '').trim();
    const imageAttachment = message.attachments.find(att => imageMimeTypes.some(mime => att.contentType?.startsWith(mime)));
    
    if (!userMessage && !imageAttachment) {
        return;
    }
    
    console.log(`[Agent] Received message from ${message.author.tag} in ${message.guild.name}. Trigger: ${isInDedicatedChannel ? 'Dedicated Channel' : 'Mention'}`);

    try {
        await message.channel.sendTyping();

        let photoDataUri: string | undefined = undefined;
        if (imageAttachment) {
            photoDataUri = await imageUrlToDataUri(imageAttachment.url);
        }

        // Fetch last 5 messages for context, unless it's a dedicated channel (which has its own history)
        let historyForPrompt: { user: string, content: string }[] = [];
        if (isInDedicatedChannel) {
            const currentHistory = conversationHistory.get(message.channel.id) || [];
            historyForPrompt = [...currentHistory]; 

            currentHistory.push({ user: message.member.displayName, content: userMessage });
            if (currentHistory.length > HISTORY_LIMIT) {
                currentHistory.shift();
            }
            conversationHistory.set(message.channel.id, currentHistory);
        } else {
             const lastMessages = await message.channel.messages.fetch({ limit: 5, before: message.id });
             historyForPrompt = lastMessages.map(m => ({ user: m.author.username, content: m.content })).reverse();
        }

        const result = await conversationalAgentFlow({
            userMessage: userMessage,
            userName: message.member.displayName,
            photoDataUri: photoDataUri,
            agentName: config.agent_name,
            agentRole: config.agent_role,
            agentPersonality: config.agent_personality,
            customPrompt: config.custom_prompt,
            knowledgeBase: config.knowledge_base,
            conversationHistory: historyForPrompt,
        });

        if (result.response) {
            // Use a try-catch block to handle cases where the original message is deleted before the bot can reply.
            try {
                await message.reply(result.response);
                if (isInDedicatedChannel) {
                    const currentHistory = conversationHistory.get(message.channel.id) || [];
                    currentHistory.push({ user: config.agent_name, content: result.response });
                    if (currentHistory.length > HISTORY_LIMIT) {
                        currentHistory.shift();
                    }
                    conversationHistory.set(message.channel.id, currentHistory);
                }
            } catch (replyError: any) {
                 if (replyError.code === 10008) { // Unknown Message
                    console.warn(`[Agent] Could not reply to message ${message.id} because it was deleted.`);
                } else {
                    throw replyError; // Re-throw other errors
                }
            }
        }

    } catch (error) {
        console.error('[Agent] Error during conversational agent flow:', error);
        // Also wrap the error message reply in a try-catch
        try {
            await message.reply("Désolé, une erreur est survenue pendant que je réfléchissais. Veuillez réessayer.");
        } catch (finalError: any) {
             if (finalError.code === 10008) { // Unknown Message
                console.warn(`[Agent] Could not send error reply to message ${message.id} because it was also deleted.`);
            } else {
                console.error('[Agent] Failed to send error message:', finalError);
            }
        }
    }
}


export const name = Events.MessageCreate;
export const once = false;
export async function execute(message: Message) {
    if (message.author.bot || !message.guild) return; // Important: Check for guild right away

    // To prevent both from firing, we can add a check.
    // Let's assume the dedicated agent channel should not trigger the FAQ.
    const agentConfig = await getServerConfig(message.guild.id, 'conversational-agent');
    if (!agentConfig) return;

    if (message.channel.id === agentConfig.dedicated_channel_id) {
        await handleConversationalAgent(message);
    } else {
        // Run both handlers. If the user mentions the bot, the conversational agent will take priority.
        // Otherwise, the FAQ trigger can run.
        await Promise.all([
            handleConversationalAgent(message),
            handleFaqTrigger(message)
        ]);
    }
}
