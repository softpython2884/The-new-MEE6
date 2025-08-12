
import express from 'express';
import cors from 'cors';
import { Client } from 'discord.js';
import { updateServerConfig, getServerConfig, getAllBotServers } from '../src/lib/db';
import { verifyAndConsumeAuthToken } from './auth';

const API_PORT = process.env.BOT_API_PORT || 3001;

export function startApi(client: Client) {
    const app = express();

    app.use(cors()); 
    app.use(express.json());

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


    app.listen(API_PORT, () => {
        console.log(`[Bot API] Le serveur API interne écoute sur le port ${API_PORT}`);
    });
}
