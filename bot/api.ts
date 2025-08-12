
import express from 'express';
import cors from 'cors';
import { Client, CategoryChannel, ChannelType } from 'discord.js';
import { updateServerConfig, getServerConfig, getAllBotServers } from '../src/lib/db';
import { verifyAndConsumeAuthToken } from './auth';

const API_PORT = process.env.BOT_API_PORT || 3001;

export function startApi(client: Client) {
    const app = express();

    app.use(cors()); 
    app.use(express.json({ limit: '50mb' })); // Increase limit for large backups

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


    app.listen(API_PORT, () => {
        console.log(`[Bot API] Le serveur API interne écoute sur le port ${API_PORT}`);
    });
}
