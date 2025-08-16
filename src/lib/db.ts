
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Client } from 'discord.js';
import type { Module, ModuleConfig, DefaultConfigs, Persona, PersonaMemory, SanctionHistoryEntry } from '../types';
import { randomBytes } from 'crypto';

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
        
        db.exec(`
            CREATE TABLE IF NOT EXISTS global_settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                reason TEXT
            );
        `);
        db.exec(`INSERT OR IGNORE INTO global_settings (key, value) VALUES ('ai_disabled', '0');`);
        console.log('[Database] La table "global_settings" est prête.');


        db.exec(`
            CREATE TABLE IF NOT EXISTS sanction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                action_type TEXT NOT NULL,
                reason TEXT,
                duration_seconds INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('[Database] La table "sanction_history" est prête.');
        
        const configColumns = db.pragma('table_info(server_configs)') as any[];
        if (!configColumns.some(col => col.name === 'premium')) {
            console.log('[Database] Mise à jour du schéma : Ajout de la colonne "premium" à server_configs.');
            db.exec('ALTER TABLE server_configs ADD COLUMN premium BOOLEAN DEFAULT FALSE');
        }
        
        db.exec(`
            CREATE TABLE IF NOT EXISTS testers (
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                expires_at DATETIME,
                PRIMARY KEY (user_id, guild_id)
            );
        `);
        console.log('[Database] La table "testers" est prête.');

        db.exec(`
            CREATE TABLE IF NOT EXISTS ai_personas (
                id TEXT PRIMARY KEY,
                guild_id TEXT NOT NULL,
                name TEXT NOT NULL,
                persona_prompt TEXT NOT NULL,
                creator_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                active_channel_id TEXT,
                avatar_url TEXT,
                role_id TEXT,
                bot_token TEXT
            );
        `);
        console.log('[Database] La table "ai_personas" est prête.');


        db.exec(`
            CREATE TABLE IF NOT EXISTS persona_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                persona_id TEXT NOT NULL,
                user_id TEXT,
                memory_type TEXT NOT NULL,
                content TEXT NOT NULL,
                salience_score INTEGER NOT NULL DEFAULT 5,
                last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (persona_id) REFERENCES ai_personas (id) ON DELETE CASCADE
            );
        `);
         console.log('[Database] La table "persona_memories" est prête.');
        
        db.exec(`
            CREATE TABLE IF NOT EXISTS persona_relationships (
                persona_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                status TEXT NOT NULL,
                level INTEGER NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (persona_id, user_id),
                FOREIGN KEY (persona_id) REFERENCES ai_personas (id) ON DELETE CASCADE
            );
        `);
        console.log('[Database] La table "persona_relationships" est prête.');


        db.exec(`
            CREATE TABLE IF NOT EXISTS premium_keys (
                key TEXT PRIMARY KEY,
                generated_by TEXT NOT NULL,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_used BOOLEAN DEFAULT FALSE,
                used_by_guild TEXT,
                used_at DATETIME
            );
        `);
        console.log('[Database] La table "premium_keys" est prête.');


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
    upgradeSchema();
};

// --- Configurations par défaut pour les nouveaux serveurs ---
const defaultConfigs: DefaultConfigs = {
    'moderation': { 
        enabled: true, 
        log_channel_id: null, 
        dm_user_on_action: true, 
        presets: [],
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
            invite: null,
            ping: null,
            help: null,
            marcus: null,
            traduire: null,
            say: null,
        },
        command_enabled: {
            invite: true,
            ping: true,
            help: true,
            marcus: true,
            traduire: true,
            say: true,
        }
    },
    'community-assistant': {
        enabled: false,
        premium: true,
        confidence_threshold: 75,
        knowledge_base: [],
        command_permissions: {
            faq: null
        }
    },
    'auto-moderation': {
        enabled: false,
        rules: [],
    },
    'logs': {
        enabled: true,
        main_channel_id: null,
        exempt_roles: [],
        exempt_channels: [],
        log_settings: {
            messages: { enabled: true, channel_id: null },
            members: { enabled: true, channel_id: null },
            channels: { enabled: false, channel_id: null },
            roles: { enabled: false, channel_id: null },
            moderation: { enabled: true, channel_id: null },
            voice: { enabled: false, channel_id: null },
        }
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
        enabled: false, 
        mode: 'approval-required', 
        approval_channel_id: null, 
        whitelisted_bots: [] 
    },
    'webcam': {
        enabled: true,
        mode: 'video_allowed',
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
        premium: true,
        exempt_roles: []
    },
    'moderation-ai': { 
        enabled: false,
        premium: true,
        alert_channel_id: null,
        alert_role_id: null,
        sensitivity: 'medium',
        exempt_roles: [],
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
        enabled: true, 
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
        enabled: true, 
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
        allow_nsfw_images: false,
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
    'tester-commands': {
        enabled: true,
        command_permissions: {
            mp: null,
            webhook: null,
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
        engagement_module_enabled: false
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
        enabled: true,
        on_join_roles: [],
        on_voice_join_roles: [],
    },
    'security-alerts': {
        enabled: true,
        alert_channel_id: null,
        account_age_check_enabled: true,
        account_age_threshold_days: 7,
        similar_username_check_enabled: true,
        similar_username_sensitivity: 80,
    },
    'moveall': {
        enabled: true,
        premium: true,
    },
    'manual-voice-control': {
        enabled: true,
        command_permissions: {
            join: null,
            leave: null,
            parle: null
        }
    }
};

export function initializeDatabase() {
    createConfigTable();
    console.log('[Database] Initialisation de la base de données terminée.');
}

export function getGlobalAiStatus(): { disabled: boolean; reason: string | null } {
    try {
        const stmt = db.prepare("SELECT value, reason FROM global_settings WHERE key = 'ai_disabled'");
        const row = stmt.get() as { value: string; reason: string | null } | undefined;
        return {
            disabled: row?.value === '1',
            reason: row?.reason || null
        };
    } catch (error) {
        console.error('[Database] Failed to get global AI status:', error);
        return { disabled: false, reason: null };
    }
}

export function setGlobalAiStatus(disabled: boolean, reason: string | null) {
    try {
        const stmt = db.prepare("UPDATE global_settings SET value = ?, reason = ? WHERE key = 'ai_disabled'");
        stmt.run(disabled ? '1' : '0', reason);
        console.log(`[Database] Global AI status set to: ${disabled ? 'DISABLED' : 'ENABLED'}. Reason: ${reason || 'N/A'}`);
    } catch (error) {
        console.error('[Database] Failed to set global AI status:', error);
    }
}

export function getServerConfig(guildId: string, module: Module): ModuleConfig | null {
    try {
        const stmt = db.prepare('SELECT config, premium FROM server_configs WHERE guild_id = ? AND module = ?');
        const result = stmt.get(guildId, module) as { config: string, premium: number } | undefined;
        const defaultConfig = defaultConfigs[module] || {};

        if (result && result.config) {
            const config = JSON.parse(result.config);
            const finalConfig = { ...defaultConfig, ...config };

            // Deep merge for nested objects to prevent overwriting with partial data
            if (defaultConfig.command_permissions && config.command_permissions) {
                finalConfig.command_permissions = { ...defaultConfig.command_permissions, ...config.command_permissions };
            }
             if (defaultConfig.command_enabled && config.command_enabled) {
                finalConfig.command_enabled = { ...defaultConfig.command_enabled, ...config.command_enabled };
            }
            if (defaultConfig.actions && config.actions) {
                finalConfig.actions = { ...defaultConfig.actions, ...config.actions };
            }
             if (defaultConfig.log_settings && config.log_settings) {
                finalConfig.log_settings = { ...defaultConfig.log_settings, ...config.log_settings };
                for (const key of Object.keys(defaultConfig.log_settings)) {
                    if(config.log_settings[key]) {
                        finalConfig.log_settings[key] = { ...defaultConfig.log_settings[key], ...config.log_settings[key] };
                    }
                }
            }
            finalConfig.premium = !!result.premium;
            return finalConfig;
        } else {
             // If no config exists for this module, create the default one and return it.
            console.log(`[Database] Aucune config trouvée pour ${guildId} et le module ${module}. Création de la config par défaut.`);
            updateServerConfig(guildId, module, defaultConfig);
            const premiumStatusStmt = db.prepare('SELECT premium FROM server_configs WHERE guild_id = ? LIMIT 1');
            const premiumResult = premiumStatusStmt.get(guildId) as { premium: number } | undefined;
            defaultConfig.premium = premiumResult ? !!premiumResult.premium : false;
            return defaultConfig;
        }
    } catch (error) {
        console.error(`[Database] Erreur lors de la récupération de la config pour ${guildId} (module: ${module}):`, error);
        return defaultConfigs[module] || null;
    }
}

export function updateServerConfig(guildId: string, module: Module, configData: ModuleConfig) {
    try {
        const { premium, ...restConfig } = configData;
        const configString = JSON.stringify(restConfig);
        
        const stmt = db.prepare(`
            INSERT INTO server_configs (guild_id, module, config)
            VALUES (?, ?, ?)
            ON CONFLICT(guild_id, module) DO UPDATE SET config = excluded.config;
        `);
        stmt.run(guildId, module, configString);
    } catch (error) {
        console.error(`[Database] Erreur lors de la mise à jour de la config pour ${guildId} (module: ${module}):`, error);
    }
}

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

export async function syncGuilds(client: Client) {
    console.log('[Database] Synchronisation des serveurs...');
    const guilds = await client.guilds.fetch();

    for (const oauthGuild of guilds.values()) {
        setupDefaultConfigs(oauthGuild.id);
    }
    console.log('[Database] Synchronisation des serveurs terminée.');
}

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

export function setPremiumStatus(guildId: string, isPremium: boolean) {
    try {
        const stmt = db.prepare(`UPDATE server_configs SET premium = ? WHERE guild_id = ?`);
        stmt.run(isPremium ? 1 : 0, guildId);
        console.log(`[Database] Statut premium mis à jour à '${isPremium}' pour le serveur ${guildId}.`);
    } catch (error) {
        console.error(`[Database] Erreur lors de la mise à jour du statut premium pour ${guildId}:`, error);
    }
}

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

export function revokeTesterStatus(userId: string, guildId: string) {
    try {
        const stmt = db.prepare('DELETE FROM testers WHERE user_id = ? AND guild_id = ?');
        stmt.run(userId, guildId);
    } catch (error) {
        console.error(`[Database] Erreur lors de la révocation du statut de testeur pour ${userId}:`, error);
    }
}

export function checkTesterStatus(userId: string, guildId: string): { isTester: boolean; expires_at: Date | null } {
    try {
        const stmt = db.prepare('SELECT expires_at FROM testers WHERE user_id = ? AND guild_id = ?');
        const row = stmt.get(userId, guildId) as { expires_at: string | null } | undefined;

        if (!row) {
            return { isTester: false, expires_at: null };
        }

        if (row.expires_at === null) {
            return { isTester: true, expires_at: null };
        }

        const expiresAt = new Date(row.expires_at);
        if (expiresAt > new Date()) {
            return { isTester: true, expires_at: expiresAt };
        } else {
            revokeTesterStatus(userId, guildId);
            return { isTester: false, expires_at: null };
        }
    } catch (error) {
        console.error(`[Database] Erreur lors de la vérification du statut de testeur pour ${userId}:`, error);
        return { isTester: false, expires_at: null };
    }
}

export function getPersonasForGuild(guildId: string): Persona[] {
    const stmt = db.prepare('SELECT * FROM ai_personas WHERE guild_id = ?');
    return stmt.all(guildId) as Persona[];
}

export function createPersona(persona: Omit<Persona, 'created_at'>): void {
    const stmt = db.prepare(`
        INSERT INTO ai_personas (id, guild_id, name, persona_prompt, creator_id, active_channel_id, avatar_url, role_id, bot_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(persona.id, persona.guild_id, persona.name, persona.persona_prompt, persona.creator_id, persona.active_channel_id, persona.avatar_url, persona.role_id, persona.bot_token);
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

export function getMemoriesForPersona(personaId: string, userIds: (string | null)[]): PersonaMemory[] {
    // Ensure userIds always contains at least one value to prevent SQL syntax errors, even if it's a value that won't match (like NULL for user_id)
    const placeholders = userIds.length > 0 ? userIds.map(() => '?').join(',') : 'NULL';
    
    const query = `
        SELECT * FROM persona_memories 
        WHERE persona_id = ? AND (user_id IN (${placeholders}) OR user_id IS NULL)
        ORDER BY salience_score DESC, last_accessed_at DESC 
        LIMIT 20
    `;
    
    const params: (string | number | null)[] = [personaId, ...userIds];
    
    const stmt = db.prepare(query);
    const memories = stmt.all(...params) as PersonaMemory[];
    
    // Touch memories to update last_accessed_at
    if (memories.length > 0) {
        const touchStmt = db.prepare(`UPDATE persona_memories SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?`);
        const touchTransaction = db.transaction((mems) => {
            for (const mem of mems) touchStmt.run(mem.id);
        });
        touchTransaction(memories);
    }

    return memories;
}


export function createMemory(memory: Omit<PersonaMemory, 'id' | 'created_at' | 'last_accessed_at'>): void {
    const stmt = db.prepare(`
        INSERT INTO persona_memories (persona_id, user_id, memory_type, content, salience_score)
        VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(memory.persona_id, memory.user_id, memory.memory_type, memory.content, memory.salience_score);
}

export function createMultipleMemories(memories: Omit<PersonaMemory, 'id' | 'created_at' | 'last_accessed_at'>[]): void {
    const insert = db.prepare(`
        INSERT INTO persona_memories (persona_id, user_id, memory_type, content, salience_score)
        VALUES (@persona_id, @user_id, @memory_type, @content, @salience_score)
    `);
    const insertMany = db.transaction((mems) => {
        for (const mem of mems) insert.run(mem);
    });
    insertMany(memories);
}

export function createPremiumKey(generatedBy: string): string {
    const key = `MARCUS-${randomBytes(8).toString('hex').toUpperCase()}`;
    const stmt = db.prepare('INSERT INTO premium_keys (key, generated_by) VALUES (?, ?)');
    stmt.run(key, generatedBy);
    return key;
}

export function redeemPremiumKey(key: string, guildId: string): { success: boolean; message: string } {
    const stmt = db.prepare('SELECT * FROM premium_keys WHERE key = ?');
    const row = stmt.get(key) as { is_used: number; used_by_guild: string } | undefined;

    if (!row) {
        return { success: false, message: 'Clé invalide.' };
    }

    if (row.is_used) {
        if (row.used_by_guild === guildId) {
            return { success: false, message: 'Cette clé a déjà été activée pour ce serveur.' };
        }
        return { success: false, message: 'Cette clé a déjà été utilisée par un autre serveur.' };
    }

    const updateStmt = db.prepare('UPDATE premium_keys SET is_used = TRUE, used_by_guild = ?, used_at = CURRENT_TIMESTAMP WHERE key = ?');
    updateStmt.run(guildId, key);

    setPremiumStatus(guildId, true);

    return { success: true, message: 'Clé premium activée avec succès !' };
}

// --- Sanction History ---

export function recordSanction(sanction: Omit<SanctionHistoryEntry, 'id' | 'timestamp'>) {
    const stmt = db.prepare(`
        INSERT INTO sanction_history (guild_id, user_id, moderator_id, action_type, reason, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
        sanction.guild_id,
        sanction.user_id,
        sanction.moderator_id,
        sanction.action_type,
        sanction.reason,
        sanction.duration_seconds
    );
}

export function getUserSanctionHistory(guildId: string, userId: string): SanctionHistoryEntry[] {
    const stmt = db.prepare(`
        SELECT * FROM sanction_history
        WHERE guild_id = ? AND user_id = ?
        ORDER BY timestamp DESC
        LIMIT 10
    `);
    return stmt.all(guildId, userId) as SanctionHistoryEntry[];
}
