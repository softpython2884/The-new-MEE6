

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Client } from 'discord.js';
import type { Module, ModuleConfig, DefaultConfigs } from '../types';

// Assurez-vous que le répertoire de la base de données existe
const dbDir = path.resolve(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, 'bot.db');
const db = new Database(dbPath);
console.log(`[Database] Connecté à la base de données SQLite sur ${dbPath}`);


// --- Schéma et Migration de la Base de Données ---
const upgradeSchema = () => {
    try {
        db.pragma('journal_mode = WAL');
        // Check for premium column
        const columns = db.pragma('table_info(server_configs)');
        const hasPremiumColumn = columns.some((col: any) => col.name === 'premium');

        if (!hasPremiumColumn) {
            console.log('[Database] Mise à jour du schéma : Ajout de la colonne "premium".');
            db.exec('ALTER TABLE server_configs ADD COLUMN premium BOOLEAN DEFAULT FALSE');
        }
    } catch (error) {
        console.error('[Database] Erreur lors de la mise à jour du schéma:', error);
    }
};


const createConfigTable = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS server_configs (
            guild_id TEXT NOT NULL,
            module TEXT NOT NULL,
            config TEXT NOT NULL,
            premium BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (guild_id, module)
        );
    `);
    console.log('[Database] La table "server_configs" est prête.');
    // Run schema upgrades after ensuring the table exists
    upgradeSchema();
};

// --- Configurations par défaut pour les nouveaux serveurs ---
// Basé sur la documentation fournie
const defaultConfigs: DefaultConfigs = {
    'moderation': { 
        enabled: true, 
        log_channel_id: null, 
        dm_user_on_action: true, 
        presets: [], 
        premium: false,
        command_permissions: {
            ban: null,
            unban: null,
            kick: null,
            mute: null,
        }
    },
    'general-commands': {
        command_permissions: {
            invite: null, // null means @everyone
            ping: null,
        },
        command_enabled: {
            invite: true,
            ping: true,
        }
    },
    'community-assistant': {
        enabled: true,
        premium: false, // Defaulting to false, will be checked
        confidence_threshold: 75,
        knowledge_base: [],
        command_permissions: {
            faq: null
        }
    },
    'auto-moderation': {
        enabled: true,
        exempt_roles: [],
        forbidden_vocabulary_enabled: false,
        forbidden_vocabulary_words: [],
        forbidden_vocabulary_action: 'delete',
        discord_invites_enabled: true,
        discord_invites_action: 'delete',
        external_links_enabled: false,
        external_links_allowed_domains: [],
        external_links_action: 'delete',
        excessive_caps_enabled: true,
        excessive_caps_threshold_percentage: 70,
        excessive_caps_action: 'warn',
        excessive_emojis_enabled: false,
        excessive_emojis_max_emojis: 10,
        excessive_emojis_action: 'delete',
        excessive_mentions_enabled: true,
        excessive_mentions_max_mentions: 5,
        excessive_mentions_action: 'warn',
        message_spam_enabled: true,
        message_spam_action: 'warn',
    },
    'logs': { 
        enabled: true, 
        log_channel_id: null,
        'log-messages': true,
        'log-members': true,
        'log-channels': false,
        'log-roles': false,
        'log-moderation': true,
    },
    'auto-translation': {
        enabled: false,
        premium: false,
        mode: 'inline',
        channels: [],
    },
     'lock': {
        enabled: true,
        exempt_roles: [],
        command_permissions: {
            lock: null,
            unlock: null,
        }
    },
    'backup': {
        enabled: true,
        command_permissions: {
            backup: null
        }
    },
    'anti-bot': { 
        enabled: true, 
        mode: 'disabled', 
        approval_channel_id: null, 
        whitelisted_bots: [] 
    },
    'webcam': {
        enabled: true,
        mode: 'allowed',
    },
    'captcha': { enabled: true, verification_channel: null, type: 'text', difficulty: 'medium', verified_role_id: null },
    'image-filter': { enabled: true, sensitivity: 'medium' },
    'moderation-ai': { enabled: true, mode: 'monitor' },
    'adaptive-anti-raid': { 
        enabled: true, 
        raid_detection_enabled: true, 
        raid_sensitivity: 'medium', 
        raid_action: 'lockdown',
        link_scanner_enabled: true,
        link_scanner_action: 'delete',
        alert_channel_id: null
    },
    'private-rooms': { enabled: true, creation_channel: null, category_id: null, embed_message: '', archive_summary: true },
    'smart-events': { enabled: true, suggest_time: true, templates: 'quiz', rsvp_tracking: true, recurring_events: false },
    'smart-voice': { enabled: true, interactive_channels: [], creation_threshold: 4 },
    'content-ai': { enabled: true, default_tone: 'familiar', custom_instructions: '' },
    'server-builder': { enabled: true, base_theme: 'gaming', detail_level: 'standard' },
    // D'autres modules peuvent être ajoutés ici
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
        const stmt = db.prepare('SELECT config, premium FROM server_configs WHERE guild_id = ? AND module = ?');
        const result = stmt.get(guildId, module) as { config: string, premium: number } | undefined;

        if (result && result.config) {
            const config = JSON.parse(result.config);
            
            // Merge with default config to ensure all keys are present
            const defaultConfig = defaultConfigs[module] || {};
            const finalConfig = { ...defaultConfig, ...config };

            // Deep merge for nested objects like command_permissions
             if (defaultConfig.command_permissions && config.command_permissions) {
                finalConfig.command_permissions = { ...defaultConfig.command_permissions, ...config.command_permissions };
            }
             if (defaultConfig.command_enabled && config.command_enabled) {
                finalConfig.command_enabled = { ...defaultConfig.command_enabled, ...config.command_enabled };
            }


            finalConfig.premium = !!result.premium;
            
            return finalConfig;
        } else {
            // Si aucune config n'est trouvée, on insère la config par défaut et on la retourne
            const defaultConfig = defaultConfigs[module];
            if (defaultConfig) {
                console.log(`[Database] Aucune config trouvée pour ${guildId} et le module ${module}. Création de la config par défaut.`);
                updateServerConfig(guildId, module, defaultConfig);
                // Return the default config with the current premium status of the server
                const premiumStatusStmt = db.prepare('SELECT premium FROM server_configs WHERE guild_id = ? LIMIT 1');
                const premiumResult = premiumStatusStmt.get(guildId) as { premium: number } | undefined;
                defaultConfig.premium = premiumResult ? !!premiumResult.premium : false;
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
        // Le statut premium est géré globalement par setPremiumStatus, mais on s'assure qu'il est bien dans l'objet
        const currentConfig = getServerConfig(guildId, module);
        const isPremium = currentConfig?.premium || configData.premium || false;
        
        const { premium, ...restConfig } = configData;
        const configString = JSON.stringify(restConfig);
        
        const stmt = db.prepare(`
            INSERT INTO server_configs (guild_id, module, config, premium)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(guild_id, module) DO UPDATE SET config = excluded.config;
        `);
        stmt.run(guildId, module, configString, isPremium ? 1 : 0);
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
        const guild = await oauthGuild.fetch();
        for (const moduleName of Object.keys(defaultConfigs) as Module[]) {
             const existing = stmt.get(guild.id, moduleName);
             if (!existing) {
                 console.log(`[Database] Ajout de la configuration par défaut du module '${moduleName}' pour le nouveau serveur ${guild.name} (${guild.id})`);
                 updateServerConfig(guild.id, moduleName, defaultConfigs[moduleName]!);
             }
        }
    }
    console.log('[Database] Synchronisation des serveurs terminée.');
}

// Fonction pour récupérer la liste de tous les serveurs sur lesquels le bot est présent.
// Utile pour le panel afin d'afficher la liste des serveurs.
// Cette fonction est appelée par l'API du bot, qui a accès au client Discord.
// Pour l'instant on se base sur la DB.
export function getAllBotServers(): { id: string; name: string; icon: string | null }[] {
    try {
        const stmt = db.prepare('SELECT DISTINCT guild_id FROM server_configs');
        const rows = stmt.all() as { guild_id: string }[];
        return rows.map(row => ({ id: row.guild_id, name: 'Unknown Server', icon: null }));
    } catch (error) {
        console.error('[Database] Erreur lors de la récupération de tous les serveurs:', error);
        return [];
    }
}

/**
 * Met à jour le statut premium d'un serveur pour tous ses modules.
 * @param guildId L'ID du serveur.
 * @param isPremium Le nouveau statut premium.
 */
export function setPremiumStatus(guildId: string, isPremium: boolean) {
    try {
        const stmt = db.prepare(`UPDATE server_configs SET premium = ? WHERE guild_id = ?`);
        stmt.run(isPremium ? 1 : 0, guildId);
        console.log(`[Database] Statut premium mis à jour à '${isPremium}' pour le serveur ${guildId}.`);
    } catch (error) {
        console.error(`[Database] Erreur lors de la mise à jour du statut premium pour ${guildId}:`, error);
    }
}
