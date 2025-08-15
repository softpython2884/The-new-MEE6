
import express from 'express';
import cors from 'cors';
import { Client, CategoryChannel, ChannelType } from 'discord.js';
import { updateServerConfig, getServerConfig, getAllBotServers, getPersonasForGuild, updatePersona, deletePersona, createPersona } from '@/lib/db';
import { verifyAndConsumeAuthToken } from './auth';
import { generatePersonaPrompt } from '@/ai/flows/persona-flow';
import { v4 as uuidv4 } from 'uuid';

const API_PORT = process.env.BOT_API_PORT || 25875;

export function startApi(client: Client) {
    const app = express();

    // Options CORS pour autoriser les requêtes depuis n'importe quelle origine.
    // C'est utile pour le développement local.
    const corsOptions = {
      origin: '*',
      optionsSuccessStatus: 200 // Pour les navigateurs plus anciens
    };

    app.use(cors(corsOptions));
    // Gérer les requêtes pre-flight pour toutes les routes
    app.options('*', cors(corsOptions));

    app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les grosses sauvegardes

    app.use((req, res, next) => {
        console.log(`[Bot API] Requête reçue : ${req.method} ${req.path}`);
        next();
    });

    /**
     * Endpoint for the panel to verify a user's auth token.
     * This is public and does not use any internal secret.
     */
    app.post('/api/verify-token', (req, res) => {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token is required.' });
        }
        
        const authResult = verifyAndConsumeAuthToken(token);
        
        if (!authResult) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
        
        // In a real app, you would generate a session token (e.g., JWT) here
        // and return it to the client to store in a cookie.
        // For simplicity, we'll just return the guildId directly.
        res.status(200).json({ success: true, guildId: authResult.guildId });
    });

    /**
     * Endpoint pour mettre à jour la configuration d'un module pour un serveur.
     */
    app.post('/api/update-config/:guildId/:module', async (req, res) => {
        const { guildId, module } = req.params;
        const configData = req.body;

        if (!guildId || !module || !configData) {
            return res.status(400).json({ error: 'Guild ID, module et données de configuration sont requis.' });
        }

        try {
            console.log(`[Bot API] Mise à jour de la config pour le serveur ${guildId}, module ${module}`);
            await updateServerConfig(guildId, module as any, configData);

            // Handle specific side-effects for modules
            if (module === 'server-identity') {
                const guild = await client.guilds.fetch(guildId);
                if (guild.members.me) {
                    // Update server-specific nickname
                    await guild.members.me.setNickname(configData.nickname || null);
                    // NOTE: Changing the bot's avatar is a GLOBAL action and cannot be done on a per-server basis.
                    // The discord.js library function `guild.members.me.setAvatar` does not exist.
                    // The global avatar can be changed with `client.user.setAvatar`, but that affects all servers.
                    // We will only handle the nickname change to avoid incorrect behavior.
                }
            }
            
            res.status(200).json({ success: true, message: `Configuration pour le module ${module} mise à jour.` });
        } catch (error) {
            console.error(`[Bot API] Erreur lors de la mise à jour de la config pour ${guildId}:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
    });

    /**
     * Endpoint pour récupérer la configuration d'un module pour un serveur.
     */
    app.get('/api/get-config/:guildId/:module', async (req, res) => {
        const { guildId, module } = req.params;
        try {
            const config = await getServerConfig(guildId, module as any);
            if (!config) {
                return res.status(404).json({ message: 'Configuration non trouvée. Utilisation des valeurs par défaut.' });
            }
            res.json(config);
        } catch (error) {
            console.error(`[Bot API] Erreur lors de la récupération de la config pour ${guildId}:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
    });

    /**
     * Endpoint pour récupérer les données d'un serveur (nom, icône, rôles, salons, statut premium).
     */
     app.get('/api/get-server-details/:guildId', async (req, res) => {
        const { guildId } = req.params;
        try {
            const guild = await client.guilds.fetch(guildId).catch(() => null);
            if (!guild) {
                return res.status(404).json({ error: 'Serveur non trouvé.' });
            }

            // Fetch server config to get premium status
            const premiumConfig = await getServerConfig(guildId, 'moderation'); // Can be any module, just to check premium status.

            const serverDetails = {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL(),
                isPremium: premiumConfig?.premium || false,
                channels: Array.from(guild.channels.cache.values()).map(c => ({ id: c.id, name: c.name, type: c.type })),
                roles: Array.from(guild.roles.cache.values()).map(r => ({ id: r.id, name: r.name, color: r.color })),
            };
            
            res.json(serverDetails);
        } catch (error) {
            console.error(`[Bot API] Erreur lors de la récupération des détails pour ${guildId}:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
    });

    /**
     * Endpoint to get details for multiple servers from a list of IDs.
     */
    app.post('/api/get-servers-details', async (req, res) => {
        const { guildIds } = req.body;
        if (!Array.isArray(guildIds)) {
            return res.status(400).json({ error: 'guildIds must be an array.' });
        }

        try {
            const promises = guildIds.map(id => client.guilds.fetch(id).catch(() => null));
            const guilds = await Promise.all(promises);

            const serversDetails = guilds
                .filter(g => g !== null)
                .map(guild => ({
                    id: guild!.id,
                    name: guild!.name,
                    iconURL: guild!.iconURL(),
                }));
            
            res.json(serversDetails);
        } catch (error) {
            console.error(`[Bot API] Error fetching details for multiple servers:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
    });

    /**
     * Endpoint to export server structure as JSON for the backup module.
     */
    app.get('/api/backup/:guildId/export', async (req, res) => {
        const { guildId } = req.params;
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            return res.status(404).json({ error: 'Serveur non trouvé.' });
        }

        try {
            const backup = {
                name: guild.name,
                id: guild.id,
                exportedAt: new Date().toISOString(),
                roles: guild.roles.cache
                    .filter(role => !role.managed) // Don't save integrated roles (bots)
                    .map(role => ({
                        name: role.name,
                        color: role.hexColor,
                        hoist: role.hoist,
                        permissions: role.permissions.bitfield.toString(),
                        mentionable: role.mentionable,
                    })),
                channels: guild.channels.cache
                    .filter(c => c.type !== ChannelType.GuildVoice) // Start with categories and text channels
                    .map(channel => {
                        const baseChannelData = {
                            type: channel.type,
                            name: channel.name,
                            permissionOverwrites: channel.permissionOverwrites.cache.map(ow => ({
                                id: ow.id,
                                type: ow.type,
                                allow: ow.allow.bitfield.toString(),
                                deny: ow.deny.bitfield.toString(),
                            })),
                        };
                        if (channel instanceof CategoryChannel) {
                            return {
                                ...baseChannelData,
                                children: channel.children.cache.map(child => ({
                                    type: child.type,
                                    name: child.name,
                                    topic: 'topic' in child ? child.topic : null,
                                    nsfw: 'nsfw' in child ? child.nsfw : false,
                                    permissionOverwrites: child.permissionOverwrites.cache.map(ow => ({
                                        id: ow.id,
                                        type: ow.type,
                                        allow: ow.allow.bitfield.toString(),
                                        deny: ow.deny.bitfield.toString(),
                                    }))
                                }))
                            };
                        }
                        if (!channel.parentId) {
                             return { // Channels without category
                                ...baseChannelData,
                                topic: 'topic' in channel ? channel.topic : null,
                                nsfw: 'nsfw' in channel ? channel.nsfw : false,
                            };
                        }
                        return null;
                    }).filter(c => c !== null)
            };

            res.json(backup);

        } catch (error) {
            console.error(`[Backup API] Erreur lors de l'exportation pour ${guildId}:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur lors de l\'exportation.' });
        }
    });

    // --- AI Personas API ---

    app.get('/api/personas/:guildId', (req, res) => {
        const { guildId } = req.params;
        try {
            const personas = getPersonasForGuild(guildId);
            res.json(personas);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch personas.' });
        }
    });

    app.post('/api/personas/generate-prompt', async (req, res) => {
        const { name, instructions } = req.body;
        if (!name || !instructions) {
            return res.status(400).json({ error: 'Name and instructions are required.' });
        }
        try {
            const personaPrompt = await generatePersonaPrompt({ name, instructions });
            res.json({ personaPrompt });
        } catch (error) {
            res.status(500).json({ error: 'Failed to generate persona prompt.' });
        }
    });

    app.post('/api/personas/create', (req, res) => {
        const { guild_id, name, persona_prompt, creator_id } = req.body;
         if (!guild_id || !name || !persona_prompt || !creator_id) {
            return res.status(400).json({ error: 'Missing required fields for persona creation.' });
        }
        try {
            const newPersona = {
                id: uuidv4(),
                guild_id,
                name,
                persona_prompt,
                creator_id,
                active_channel_id: null
            };
            createPersona(newPersona);
            res.status(201).json(newPersona);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create persona.' });
        }
    });

    app.patch('/api/personas/:personaId', (req, res) => {
        const { personaId } = req.params;
        const updates = req.body;
        try {
            updatePersona(personaId, updates);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update persona.' });
        }
    });

    app.delete('/api/personas/:personaId', (req, res) => {
        const { personaId } = req.params;
        try {
            deletePersona(personaId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete persona.' });
        }
    });


    app.listen(API_PORT, () => {
        console.log(`[Bot API] Le serveur API interne écoute sur le port ${API_PORT}`);
    });
}
