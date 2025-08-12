

import { Events, Message } from 'discord.js';
import { moderationAiFlow } from '../../../src/ai/flows/moderation-ai-flow';
import { getServerConfig } from '@/lib/db';


export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (!message.guild || message.author.bot || !message.content) return;

    const modAiConfig = await getServerConfig(message.guild.id, 'moderation-ai');

    if (!modAiConfig?.enabled) {
        return;
    }
    
    try {
        const result = await moderationAiFlow({
            messageContent: message.content,
        });

        if (result.isToxic) {
             console.log(`[Mod-AI] Toxic message detected from ${message.author.tag} in ${message.guild.name}. Reason: ${result.reason}, Severity: ${result.severity}`);

            switch (modAiConfig.mode) {
                case 'monitor':
                    // Do nothing, just log to console (already done above)
                    break;
                case 'recommend':
                    // In a real scenario, this would send a message to a private mod channel with action buttons.
                    console.log(`[Mod-AI] Recommendation mode: Action would be proposed to moderators.`);
                    break;
                case 'auto-act':
                    if (result.severity === 'medium' || result.severity === 'high') {
                        // 1. Delete the message
                        await message.delete();

                        // 2. Send the explanation
                        await message.channel.send({
                            content: `> **${message.author.toString()}, votre message a été supprimé par la modération automatique.**\n> **Raison :** Comportement jugé inapproprié (${result.reason}).`,
                        });
                    }
                    break;
            }
        }

    } catch (error) {
        console.error('[Mod-AI] Error during message analysis flow:', error);
    }
}
