
import express from 'express';
import cors from 'cors';
import { Client } from 'discord.js';
import { updateServerConfig, getServerConfig, getAllBotServers, IServer } from '../src/lib/db';

const API_PORT = process.env.BOT_API_PORT || 3001;

// Middleware simple pour la vérification du secret partagé
const verifyInternalSecret = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_API_SECRET) {
        console.warn(`[Bot API] Tentative d'accès non autorisé avec le secret : ${secret}`);
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

export function startApi(client: Client) {
    const app = express();

    app.use(cors()); // Pour l'instant, on laisse ouvert, on pourra restreindre plus tard
    app.use(express.json());

    app.use((req, res, next) => {
        console.log(`[Bot API] Requête reçue : ${req.method} ${req.path}`);
        next();
    });

    /**
     * Endpoint pour mettre à jour la configuration d'un serveur.
     * Sécurisé par un secret partagé.
     */
    app.post('/api/update-config/:guildId/:module', verifyInternalSecret, async (req, res) => {
        const { guildId, module } = req.params;
        const configData = req.body;

        if (!guildId || !module || !configData) {
            return res.status(400).json({ error: 'Guild ID, module et données de configuration sont requis.' });
        }

        try {
            console.log(`[Bot API] Mise à jour de la config pour le serveur ${guildId}, module ${module}`);
            await updateServerConfig(guildId, module, configData);
            
            // TODO: Invalider un cache de configuration si on en met un en place.
            
            res.status(200).json({ success: true, message: `Configuration pour le module ${module} mise à jour.` });
        } catch (error) {
            console.error(`[Bot API] Erreur lors de la mise à jour de la config pour ${guildId}:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
    });

    /**
     * Endpoint pour récupérer la configuration d'un serveur.
     * Sécurisé par un secret partagé.
     */
    app.get('/api/get-config/:guildId/:module', verifyInternalSecret, async (req, res) => {
        const { guildId, module } = req.params;
        try {
            const config = await getServerConfig(guildId, module);
            if (!config) {
                return res.status(404).json({ error: 'Configuration non trouvée.' });
            }
            res.json(config);
        } catch (error) {
            console.error(`[Bot API] Erreur lors de la récupération de la config pour ${guildId}:`, error);
            res.status(500).json({ error: 'Erreur interne du serveur.' });
        }
    });

    /**
     * Endpoint pour récupérer les données d'un serveur (nom, icône, etc.)
     * Sécurisé par un secret partagé.
     */
     app.get('/api/get-server-details/:guildId', verifyInternalSecret, async (req, res) => {
        const { guildId } = req.params;
        try {
            const allServers = getAllBotServers(); // Ceci vient de la DB
            const serverDetails = allServers.find(s => s.id === guildId);

            if (!serverDetails) {
                return res.status(404).json({ error: 'Serveur non trouvé dans la base de données.' });
            }
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

    