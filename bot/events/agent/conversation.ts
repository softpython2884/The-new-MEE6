
import { Events, Message } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';
import { conversationalAgentFlow } from '../../../src/ai/flows/conversational-agent-flow';

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    // Ignore bots, and messages that don't mention the bot
    if (message.author.bot || !message.mentions.has(message.client.user.id)) {
        return;
    }

    if (!message.guild) return;

    const config = await getServerConfig(message.guild.id, 'conversational-agent');

    // Check if the module is enabled and premium
    if (!config?.enabled || !config.premium) {
        return;
    }

    // Remove the bot's mention from the message to get the actual prompt
    const userMessage = message.content.replace(/<@!?\d+>/, '').trim();
    if (!userMessage) {
        // The user just pinged the bot without a message
        return;
    }
    
    console.log(`[Agent] Received message from ${message.author.tag} in ${message.guild.name}.`);

    try {
        // Start typing indicator
        await message.channel.sendTyping();

        const result = await conversationalAgentFlow({
            userMessage: userMessage,
            agentName: config.agent_name,
            agentRole: config.agent_role,
            agentPersonality: config.agent_personality,
            customPrompt: config.custom_prompt,
            knowledgeBase: config.knowledge_base,
        });

        if (result.response) {
            await message.reply(result.response);
        }

    } catch (error) {
        console.error('[Agent] Error during conversational agent flow:', error);
        await message.reply("Désolé, une erreur est survenue pendant que je réfléchissais. Veuillez réessayer.");
    }
}
