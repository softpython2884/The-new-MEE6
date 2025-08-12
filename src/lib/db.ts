
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Client, Collection } from 'discord.js';
import type { Module, ModuleConfig, DefaultConfigs } from '@/types';

// Assurez-vous que le répertoire de la base de données existe
const dbDir = path.resolve(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, 'bot.db');
const db = new Database(dbPath);
console.log(`[Database] Connecté à la base de données SQLite sur ${dbPath}`);


// --- Structure de la table de configuration ---
const createConfigTable = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS server_configs (
            guild_id TEXT NOT NULL,
            module TEXT NOT NULL,
            config TEXT NOT NULL,
            PRIMARY KEY (guild_id, module)
        );
    `);
    console.log('[Database] La table "server_configs" est prête.');
};

// --- Configurations par défaut pour les nouveaux serveurs ---
const defaultConfigs: DefaultConfigs = {
    'moderation': { enabled: true, log_channel_id: null, dm_user_on_action: true },
    'auto-moderation': { enabled: true },
    'anti-bot': { enabled: false, mode: 'disabled' },
    'captcha': { enabled: false },
    'logs': { enabled: true, log_channel_id: null },
    // Ajoutez d'autres configurations par défaut ici
};

/**
 * Initialise la base de données en créant les tables nécessaires.
 */
export function initializeDatabase() {
    createConfigTable();
    console.log('[Database] Initialisation de la base de données terminée.');
}

/**
 * Récupère la configuration d'un module pour un serveur donné.
 * @param guildId L'ID du serveur.
 * @param module Le nom du module.
 * @returns La configuration du module, ou la configuration par défaut si aucune n'est trouvée.
 */
export function getServerConfig(guildId: string, module: Module): ModuleConfig | null {
    try {
        const stmt = db.prepare('SELECT config FROM server_configs WHERE guild_id = ? AND module = ?');
        const result = stmt.get(guildId, module) as { config: string } | undefined;

        if (result) {
            return JSON.parse(result.config);
        } else {
            // Si aucune config n'est trouvée, on insère la config par défaut et on la retourne
            const defaultConfig = defaultConfigs[module];
            if (defaultConfig) {
                console.log(`[Database] Aucune config trouvée pour ${guildId} et le module ${module}. Création de la config par défaut.`);
                updateServerConfig(guildId, module, defaultConfig);
                return defaultConfig;
            }
            return null;
        }
    } catch (error) {
        console.error(`[Database] Erreur lors de la récupération de la config pour ${guildId} (module: ${module}):`, error);
        return defaultConfigs[module] || null; // Fallback sécurisé
    }
}

/**
 * Met à jour la configuration d'un module pour un serveur donné.
 * @param guildId L'ID du serveur.
 * @param module Le nom du module.
 * @param configData Les nouvelles données de configuration.
 */
export function updateServerConfig(guildId: string, module: Module, configData: ModuleConfig) {
    try {
        const configString = JSON.stringify(configData);
        const stmt = db.prepare(`
            INSERT INTO server_configs (guild_id, module, config)
            VALUES (?, ?, ?)
            ON CONFLICT(guild_id, module) DO UPDATE SET config = excluded.config;
        `);
        stmt.run(guildId, module, configString);
        // console.log(`[Database] Configuration mise à jour pour le serveur ${guildId}, module ${module}.`);
    } catch (error) {
        console.error(`[Database] Erreur lors de la mise à jour de la config pour ${guildId} (module: ${module}):`, error);
    }
}


/**
 * Synchronise les serveurs du bot avec la base de données.
 * Crée une configuration par défaut pour chaque module pour les nouveaux serveurs.
 * @param client Le client Discord.
 */
export async function syncGuilds(client: Client) {
    console.log('[Database] Synchronisation des serveurs...');
    const guilds = await client.guilds.fetch();

    const stmt = db.prepare('SELECT 1 FROM server_configs WHERE guild_id = ? AND module = ?');

    for (const oauthGuild of guilds.values()) {
        for (const moduleName of Object.keys(defaultConfigs) as Module[]) {
             const existing = stmt.get(oauthGuild.id, moduleName);
             if (!existing) {
                 console.log(`[Database] Ajout de la configuration par défaut du module '${moduleName}' pour le nouveau serveur ${oauthGuild.name} (${oauthGuild.id})`);
                 updateServerConfig(oauthGuild.id, moduleName, defaultConfigs[moduleName]!);
             }
        }
    }
    console.log('[Database] Synchronisation des serveurs terminée.');
}

// Fonction pour récupérer la liste de tous les serveurs sur lesquels le bot est présent.
// Utile pour le panel afin d'afficher la liste des serveurs.
export function getAllBotServers(): { id: string; name: string; icon: string | null }[] {
    try {
        // Cette requête est un peu plus complexe. Elle récupère tous les guild_id uniques,
        // puis on pourrait la joindre à une autre table `guild_details` si on voulait stocker
        // le nom et l'icône directement dans la DB.
        // Pour l'instant, on se contente de retourner une liste vide,
        // car le panel récupérera les détails via l'API du bot qui a accès au client Discord.
        const stmt = db.prepare('SELECT DISTINCT guild_id FROM server_configs');
        const rows = stmt.all() as { guild_id: string }[];
        // On retourne juste les IDs, le panel devra demander les détails pour chaque ID.
        return rows.map(row => ({ id: row.guild_id, name: 'Unknown', icon: null }));
    } catch (error) {
        console.error('[Database] Erreur lors de la récupération de tous les serveurs:', error);
        return [];
    }
}
