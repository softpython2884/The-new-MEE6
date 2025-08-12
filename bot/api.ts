
import express from 'express';
import cors from 'cors';
import { Client, PermissionFlagsBits } from 'discord.js';
import { getAllBotServers } from '../src/lib/db';

const API_PORT = process.env.BOT_API_PORT || 3001;

export function startApi(client: Client) {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use((req, res, next) => {
        console.log(`[Bot API] Received request: ${req.method} ${req.path}`);
        next();
    });


    /**
     * GET /api/user-servers/:userToken/:userId
     * Gets all servers a user has admin permissions in.
     * This now uses the USER'S access token to fetch THEIR guilds.
     */
    app.get('/api/user-servers/:userToken/:userId', async (req, res) => {
        const { userToken, userId } = req.params;
        console.log(`[Bot API] Fetching servers for user ID: ${userId}`);
        if (!userId || !userToken) {
            console.log('[Bot API] Request failed: User ID and Token are required.');
            return res.status(400).json({ error: 'User ID and Token are required' });
        }

        try {
            // 1. Get all guilds the user is in, using THEIR token
            const userGuildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            
            if (!userGuildsResponse.ok) {
                const errorData = await userGuildsResponse.json();
                console.error(`[Bot API] Failed to fetch user guilds from Discord. Status: ${userGuildsResponse.status}`, errorData);
                return res.status(userGuildsResponse.status).json({ error: 'Failed to fetch user guilds from Discord.'});
            }
            const userGuilds = await userGuildsResponse.json();

            // 2. Get all guilds the bot is in (from our DB)
            const botGuilds = getAllBotServers();
            const botGuildIds = new Set(botGuilds.map(g => g.id));
            
            const manageableServers = [];
            console.log(`[Bot API] User is in ${userGuilds.length} guilds. Bot is in ${botGuilds.length} guilds. Finding common servers...`);

            for (const guild of userGuilds) {
                // 3. Check if it's a common server AND if user is an admin
                const permissions = BigInt(guild.permissions);
                if (botGuildIds.has(guild.id) && (permissions & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator) {
                     const serverInfoFromDb = botGuilds.find(s => s.id === guild.id);
                     manageableServers.push({
                        id: guild.id,
                        name: guild.name,
                        icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
                        botInServer: true,
                        isPremium: serverInfoFromDb?.isPremium || false,
                    });
                    console.log(`[Bot API] User has admin rights in common server: ${guild.name}`);
                }
            }

            console.log(`[Bot API] Found ${manageableServers.length} manageable servers for user ${userId}.`);
            res.json({ servers: manageableServers });

        } catch (error) {
            console.error('[Bot API] Error fetching user servers:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.listen(API_PORT, () => {
        console.log(`[Bot API] Server is running on port ${API_PORT} and allowing requests from specified origins.`);
    });
}
