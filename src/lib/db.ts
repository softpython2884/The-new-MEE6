

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Client } from 'discord.js';
import type { Module, ModuleConfig, DefaultConfigs, Persona } from '../types';

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
        const configColumns = db.pragma('table_info(server_configs)') as any[];
        if (!configColumns.some(col => col.name === 'premium')) {
            console.log('[Database] Mise à jour du schéma : Ajout de la colonne "premium" à server_configs.');
            db.exec('ALTER TABLE server_configs ADD COLUMN premium BOOLEAN DEFAULT FALSE');
        }
        
        // Create testers table
        db.exec(`
            CREATE TABLE IF NOT EXISTS testers (
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                expires_at DATETIME,
                PRIMARY KEY (user_id, guild_id)
            );
        `);
         console.log('[Database] La table "testers" est prête.');

         // Create ai_personas table
        db.exec(`
            CREATE TABLE IF NOT EXISTS ai_personas (
                id TEXT PRIMARY KEY,
                guild_id TEXT NOT NULL,
                name TEXT NOT NULL,
                persona_prompt TEXT NOT NULL,
                creator_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                active_channel_id TEXT
            );
        `);
        console.log('[Database] La table "ai_personas" est prête.');


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
        enabled: false, 
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
        enabled: true,
        command_permissions: {
            invite: null, // null means @everyone
            ping: null,
            help: null,
            marcus: null,
        },
        command_enabled: {
            invite: true,
            ping: true,
            help: true,
            marcus: true,
        }
    },
    'community-assistant': {
        enabled: false,
        premium: true, // Defaulting to false, will be checked
        confidence_threshold: 75,
        knowledge_base: [],
        command_permissions: {
            faq: null
        }
    },
    'auto-moderation': {
        enabled: false,
        rules: [], // This will now store native discord auto-mod rules
        scanned_channels: [],
    },
    'logs': { 
        enabled: false, 
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
        enabled: false,
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
        enabled: false, 
        mode: 'approval-required', 
        approval_channel_id: null, 
        whitelisted_bots: [] 
    },
    'webcam': {
        enabled: true,
        mode: 'allowed',
        exempt_roles: [],
    },
    'captcha': { 
        enabled: false, 
        verification_channel: null, 
        verified_role_id: null,
        premium: true
    },
    'image-filter': { 
        enabled: false, 
        sensitivity: 'medium',
        premium: true
    },
    'moderation-ai': { 
        enabled: false,
        premium: true,
        alert_channel_id: null,
        alert_role_id: null,
        actions: {
            low: 'warn',
            medium: 'mute_5m',
            high: 'mute_1h',
            critical: 'ban'
        }
    },
    'adaptive-anti-raid': { 
        enabled: false, 
        premium: true,
        raid_detection_enabled: false, 
        raid_sensitivity: 'medium', 
        raid_action: 'lockdown',
        link_scanner_enabled: false,
        link_scanner_action: 'delete',
        alert_channel_id: null
    },
    'private-rooms': { 
        enabled: false, 
        creation_channel: null, 
        category_id: null, 
        embed_message: 'Cliquez sur le bouton ci-dessous pour créer un salon privé.', 
        archive_summary: true,
        command_permissions: {
            addprivate: null,
            privateresum: null,
        }
    },
    'smart-events': { 
        enabled: false, 
        suggest_time: true, 
        templates: 'quiz', 
        rsvp_tracking: true, 
        recurring_events: false,
        command_permissions: {
            'event-create': null,
            'event-list': null
        }
    },
    'smart-voice': { 
        enabled: false, 
        premium: true,
        interactive_channels: [], 
        creation_threshold: 4,
        custom_instructions: ''
    },
    'content-ai': { 
        enabled: false, 
        premium: true,
        default_tone: 'familiar', 
        custom_instructions: '',
        command_permissions: {
            iacontent: null
        }
    },
    'server-builder': { 
        enabled: false, 
        premium: true,
        command_permissions: {
            iacreateserv: null,
            iaeditserv: null,
            iadeleteserv: null,
            iaresetserv: null,
        }
    },
    'mod-training': {
        enabled: false,
        premium: true,
        onboarding_flow_enabled: true,
        dm_delay: 'immediate',
        mentor_messages: 'Bienvenue sur le serveur, {user} ! Voici quelques règles à connaître...',
        auto_role_assignment: false,
    },
    'tester': {
        enabled: true,
        command_permissions: {
            tester: null,
        },
    },
    'conversational-agent': {
        enabled: false,
        premium: true,
        agent_name: 'Marcus',
        agent_role: 'un assistant IA utile',
        agent_personality: 'serviable, direct et concis',
        custom_prompt: '',
        knowledge_base: [],
        dedicated_channel_id: null,
    },
    'suggestions': {
        enabled: true,
        suggestion_channel_id: null,
        upvote_emoji: '👍',
        downvote_emoji: '👎',
        command_permissions: {
            suggest: null,
            setsuggest: null,
        }
    },
    'ai-personas': {
        enabled: false,
        premium: true,
        command_permissions: {
            personnage: null,
        },
    },
    'server-identity': {
        enabled: true,
        nickname: null,
        avatar_url: null,
    },
    'autoroles': {
        enabled: false,
        on_join_roles: [],
    },
    'security-alerts': {
        enabled: true,
        alert_channel_id: null,
        account_age_check_enabled: true,
        account_age_threshold_days: 7,
        similar_username_check_enabled: true,
        similar_username_sensitivity: 80,
    }
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
            if (defaultConfig.actions && config.actions) {
                finalConfig.actions = { ...defaultConfig.actions, ...config.actions };
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
        // Le statut premium est géré globalement par setPremiumStatus, et récupéré par getServerConfig.
        // Nous n'avons pas besoin de le lire ou de le réécrire ici, juste de ne pas l'inclure dans la string JSON.
        const { premium, ...restConfig } = configData;
        const configString = JSON.stringify(restConfig);
        
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
 * Sets up the default configurations for all modules for a given guild.
 * @param guildId The ID of the guild to set up.
 */
export function setupDefaultConfigs(guildId: string) {
    const stmt = db.prepare('SELECT 1 FROM server_configs WHERE guild_id = ? AND module = ?');
    
    for (const moduleName of Object.keys(defaultConfigs) as Module[]) {
        const existing = stmt.get(guildId, moduleName);
        if (!existing) {
            console.log(`[Database] Adding default config for module '${moduleName}' for guild ${guildId}`);
            updateServerConfig(guildId, moduleName, defaultConfigs[moduleName]!);
        }
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

    for (const oauthGuild of guilds.values()) {
        setupDefaultConfigs(oauthGuild.id);
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


// --- Fonctions de gestion des Testeurs ---

/**
 * Accorde le statut de testeur à un utilisateur.
 * @param userId L'ID de l'utilisateur.
 * @param guildId L'ID du serveur.
 * @param expiresAt La date d'expiration du statut. Si null, le statut n'expirera pas (cas du boost).
 */
export function giveTesterStatus(userId: string, guildId: string, expiresAt: Date | null) {
    try {
        const stmt = db.prepare(`
            INSERT INTO testers (user_id, guild_id, expires_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, guild_id) DO UPDATE SET expires_at = excluded.expires_at;
        `);
        stmt.run(userId, guildId, expiresAt ? expiresAt.toISOString() : null);
    } catch (error) {
        console.error(`[Database] Erreur lors de l'attribution du statut de testeur à ${userId}:`, error);
    }
}

/**
 * Révoque le statut de testeur d'un utilisateur.
 * @param userId L'ID de l'utilisateur.
 * @param guildId L'ID du serveur.
 */
export function revokeTesterStatus(userId: string, guildId: string) {
    try {
        const stmt = db.prepare('DELETE FROM testers WHERE user_id = ? AND guild_id = ?');
        stmt.run(userId, guildId);
    } catch (error) {
        console.error(`[Database] Erreur lors de la révocation du statut de testeur pour ${userId}:`, error);
    }
}

/**
 * Vérifie si un utilisateur a le statut de testeur actif.
 * @param userId L'ID de l'utilisateur.
 * @param guildId L'ID du serveur.
 * @returns Un objet avec le statut et la date d'expiration, ou null si non testeur.
 */
export function checkTesterStatus(userId: string, guildId: string): { isTester: boolean; expires_at: Date | null } {
    try {
        const stmt = db.prepare('SELECT expires_at FROM testers WHERE user_id = ? AND guild_id = ?');
        const row = stmt.get(userId, guildId) as { expires_at: string | null } | undefined;

        if (!row) {
            return { isTester: false, expires_at: null };
        }

        if (row.expires_at === null) { // Never expires (booster)
            return { isTester: true, expires_at: null };
        }

        const expiresAt = new Date(row.expires_at);
        if (expiresAt > new Date()) { // Not expired yet
            return { isTester: true, expires_at: expiresAt };
        } else {
            // Status a expiré, on le supprime de la base de données
            revokeTesterStatus(userId, guildId);
            return { isTester: false, expires_at: null };
        }
    } catch (error) {
        console.error(`[Database] Erreur lors de la vérification du statut de testeur pour ${userId}:`, error);
        return { isTester: false, expires_at: null };
    }
}

// --- Fonctions de gestion des Personnages IA ---

export function getPersonasForGuild(guildId: string): Persona[] {
    const stmt = db.prepare('SELECT * FROM ai_personas WHERE guild_id = ?');
    return stmt.all(guildId) as Persona[];
}

export function createPersona(persona: Omit<Persona, 'created_at'>): void {
    const stmt = db.prepare(`
        INSERT INTO ai_personas (id, guild_id, name, persona_prompt, creator_id, active_channel_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(persona.id, persona.guild_id, persona.name, persona.persona_prompt, persona.creator_id, persona.active_channel_id);
}

export function updatePersona(id: string, updates: Partial<Omit<Persona, 'id' | 'guild_id' | 'creator_id'>>): void {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE ai_personas SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
}

export function deletePersona(id: string): void {
    const stmt = db.prepare('DELETE FROM ai_personas WHERE id = ?');
    stmt.run(id);
}
