

import { Events, Message, Collection, TextChannel, EmbedBuilder, AttachmentBuilder, DMChannel } from 'discord.js';
import { getServerConfig, getPersonasForGuild, getMemoriesForPersona, createMultipleMemories } from '@/lib/db';
import { personaInteractionFlow, generatePersonaImage } from '@/ai/flows/persona-flow';
import { memoryFlow } from '@/ai/flows/memory-flow';
import type { Persona, ConversationHistoryItem } from '@/types';
import fetch from 'node-fetch';
import { ai, textModelCascade } from '@/ai/genkit';
import { defineFlow } from 'genkit';


const imageMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const PERSONA_WEBHOOK_NAME = "Marcus Persona";
const COMMON_BOT_PREFIXES = /^[!§?%%.^^]/;


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


// Cache conversation histories
const conversationHistory = new Collection<string, ConversationHistoryItem[]>();
const HISTORY_LIMIT = 20; // Increased history limit for better context

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
    if (message.author.bot) return;

    // --- DM Handling ---
    if (!message.guild) {
        // Find if this user is interacting with any persona across all guilds the bot is in.
        // This is a simplified approach. A real implementation might need a way for the user
        // to specify which persona they want to talk to. For now, we'll find the first one.
        const allGuilds = Array.from(message.client.guilds.cache.keys());
        let personaToTalkTo: Persona | undefined;
        let guildId: string | undefined;

        for (const id of allGuilds) {
            const personas = getPersonasForGuild(id);
            if (personas.length > 0) {
                // Heuristic: maybe the user shares a server with one of the personas.
                // A better approach would be to let the user select a persona to DM.
                personaToTalkTo = personas[0];
                guildId = id;
                break;
            }
        }
        
        if (personaToTalkTo && guildId) {
            console.log(`[Persona DM] Triggered: Persona "${personaToTalkTo.name}" is processing a DM from ${message.author.tag}.`);
            await handlePersonaInteraction(message, personaToTalkTo, guildId, 'Message Privé');
        } else {
             console.log(`[Persona DM] Received DM from ${message.author.tag}, but no persona could be assigned.`);
        }
        return;
    }


    // --- Guild Message Handling ---
    if (!message.member) return;

    const config = await getServerConfig(message.guild.id, 'ai-personas');
    if (!config?.enabled || !config.premium) {
        return;
    }

    const personas = getPersonasForGuild(message.guild.id);
    if (personas.length === 0) return;

    const activePersona = personas.find(p => p.active_channel_id === message.channel.id);
    const mentionedPersona = personas.find(p => p.role_id && message.mentions.roles.has(p.role_id));

    const triggeredPersona = activePersona || mentionedPersona;

    if (!triggeredPersona) {
        return;
    }
    
    // The persona should not respond to itself if it was somehow triggered by its own message via webhook.
    if (message.webhookId && message.author.username.toLowerCase() === triggeredPersona.name.toLowerCase()) {
        return;
    }

    // Pre-analysis: Ignore obvious bot commands
    if (COMMON_BOT_PREFIXES.test(message.content)) {
        console.log(`[Persona] Ignoring potential bot command from ${message.author.tag}.`);
        return;
    }
    
    // Check for image attachments in the user's message
    const imageAttachment = message.attachments.find(att => imageMimeTypes.some(mime => att.contentType?.startsWith(mime)));
    
    if (!message.content && !imageAttachment && !mentionedPersona) {
        return;
    }
    
    const interactionContext = activePersona ? 'Salon dédié actif' : 'Mention dans un groupe';
    console.log(`[Persona] Triggered: Persona "${triggeredPersona.name}" is processing a message from ${message.author.tag} in #${(message.channel as TextChannel).name}. Context: ${interactionContext}`);
    await handlePersonaInteraction(message, triggeredPersona, message.guild.id, interactionContext);
}


async function handlePersonaInteraction(message: Message, persona: Persona, guildId: string, interactionContext: string) {
     if (message.channel.isTextBased()) {
         await message.channel.sendTyping();
    }
    
    const imageAttachment = message.attachments.find(att => imageMimeTypes.some(mime => att.contentType?.startsWith(mime)));
    let photoDataUri: string | undefined = undefined;
    if (imageAttachment) {
        try {
            photoDataUri = await imageUrlToDataUri(imageAttachment.url);
        } catch (error) {
            console.error(`[Persona] Failed to process image for persona:`, error);
        }
    }

    const historyKey = message.channel.id;
    const currentHistory = conversationHistory.get(historyKey) || [];
    
    let messageTextForHistory = message.content;
    if (persona.role_id && message.mentions.roles.has(persona.role_id)) {
        messageTextForHistory = message.content.replace(`<@&${persona.role_id}>`, '').trim();
    }
    currentHistory.push({ user: message.author.username, content: messageTextForHistory });

    if (currentHistory.length > HISTORY_LIMIT) {
        currentHistory.shift();
    }
    conversationHistory.set(historyKey, currentHistory);

    const relevantMemories = getMemoriesForPersona(persona.id, [message.author.id]);
    console.log(`[Persona] Retrieved ${relevantMemories.length} relevant memories for "${persona.name}".`);

    let result;
    let lastError: any;
    for (const model of textModelCascade) {
        try {
            console.log(`[Persona] Trying model ${model} for persona interaction...`);
             result = await personaInteractionFlow({
                personaPrompt: persona.persona_prompt,
                conversationHistory: currentHistory, 
                memories: relevantMemories.map(m => ({ content: m.content, salience_score: m.salience_score })),
                photoDataUri: photoDataUri,
                interactionContext: interactionContext,
            }, model);
            console.log(`[Persona] Model ${model} succeeded.`);
            break; 
        } catch (error: any) {
            lastError = error;
             console.warn(`[Persona] Model ${model} failed with error:`, error.message);
            if (error.status === 429 || error.message.includes('quota')) {
                 console.log(`[Persona] Quota exceeded for ${model}. Trying next model...`);
                continue;
            }
            // For other errors, don't retry, just fail.
            break;
        }
    }


    if (result) {
        if (result.response || result.image_prompt) {
            let files: AttachmentBuilder[] = [];
            if (result.image_prompt) {
                console.log(`[Persona] Persona "${persona.name}" wants to generate an image with prompt: "${result.image_prompt}"`);
                try {
                    const imageResult = await generatePersonaImage({ prompt: result.image_prompt });
                    if (imageResult.imageDataUri) {
                        const imageBuffer = Buffer.from(imageResult.imageDataUri.split(',')[1], 'base64');
                        files.push(new AttachmentBuilder(imageBuffer, { name: 'persona_image.png' }));
                    }
                } catch (imgError) {
                    console.error(`[Persona] Image generation failed for "${persona.name}":`, imgError);
                }
            }

            if (result.response || files.length > 0) {
                 if (message.channel instanceof DMChannel) {
                     await message.channel.send({ content: result.response || undefined, files: files });
                 } else if (message.channel instanceof TextChannel) {
                    const webhooks = await message.channel.fetchWebhooks();
                    let webhook = webhooks.find(wh => wh.name === PERSONA_WEBHOOK_NAME && wh.token !== null);

                    if (!webhook) {
                        webhook = await message.channel.createWebhook({
                            name: PERSONA_WEBHOOK_NAME,
                            reason: 'Webhook for AI Personas'
                        });
                    }
                    await webhook.send({
                        content: result.response || undefined,
                        username: persona.name,
                        avatarURL: persona.avatar_url || message.client.user?.displayAvatarURL(),
                        files: files
                    });
                 }
            }
            
            const updatedHistory = conversationHistory.get(historyKey) || [];
            if (result.response) {
                 updatedHistory.push({ user: persona.name, content: result.response });
            }
            if (updatedHistory.length > HISTORY_LIMIT) {
                updatedHistory.shift();
            }
            conversationHistory.set(historyKey, updatedHistory);

            console.log(`[Persona Memory] Triggering memory creation for "${persona.name}".`);
            memoryFlow({
                persona_id: persona.id,
                conversationTranscript: updatedHistory.map(h => `${h.user}: ${h.content}`).join('\n')
            }).then(newMemories => {
                if (newMemories && newMemories.length > 0) {
                     console.log(`[Persona Memory] Creating ${newMemories.length} new memories for ${persona.name}.`);
                     createMultipleMemories(newMemories);
                } else {
                    console.log(`[Persona Memory] No new significant memories to create for "${persona.name}".`);
                }
            }).catch(err => console.error(`[Persona Memory] Error creating memories for "${persona.name}":`, err));

        } else {
             console.log(`[Persona] Persona "${persona.name}" chose not to respond.`);
        }
    } else {
         // All models failed, handle the final error
        console.error(`[Persona] All models in cascade failed. Last error:`, lastError);
        const ownerIds = ['556529963877138442', '760977578839506985', '800041004400902145'];
        const errorMessage = `🚨 **Erreur Critique de l'API Gemini** 🚨\n\nTous les modèles de la cascade ont échoué sur le serveur **${message.guild?.name || 'DM'}**. Les fonctionnalités IA sont probablement indisponibles.\n\n**Détails de la dernière erreur :**\n\`\`\`json\n${JSON.stringify(lastError.errorDetails || { message: lastError.message }, null, 2)}\n\`\`\``;
        
        for (const id of ownerIds) {
            try {
                const user = await message.client.users.fetch(id);
                await user.send(errorMessage);
            } catch (dmError) {
                console.error(`[Persona Error] Impossible d'envoyer un DM d'erreur à l'utilisateur ${id}`, dmError);
            }
        }
        
        try {
            await message.reply("Désolé, une erreur est survenue pendant que je réfléchissais. Les administrateurs ont été notifiés.");
        } catch (replyError: any) {
            if (replyError.code !== 10008) { // Ignore "Unknown Message" error
                console.error('[Persona] Failed to send error message:', replyError);
            }
        }
    }
}
