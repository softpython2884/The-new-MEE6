

import type {
  SlashCommandBuilder,
  CommandInteraction,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
} from 'discord.js';

export interface Command {
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

// --- Types de Configuration ---

export type Module = 
    | 'moderation'
    | 'auto-moderation'
    | 'logs'
    | 'anti-bot'
    | 'captcha'
    | 'image-filter'
    | 'moderation-ai'
    | 'adaptive-anti-raid'
    | 'private-rooms'
    | 'smart-events'
    | 'smart-voice'
    | 'content-ai'
    | 'server-builder'
    | 'premium'
    | 'general-commands'
    | 'community-assistant'
    | 'auto-translation'
    | 'lock'
    | 'backup'
    | 'webcam'
    | 'mod-training'
    | 'tester-commands'
    | 'conversational-agent'
    | 'suggestions'
    | 'ai-personas'
    | 'autoroles'
    | 'server-identity'
    | 'security-alerts'
    | 'moveall'
    | 'manual-voice-control';

export interface ModuleConfig {
  [key: string]: any; // Pour une flexibilité maximale
}

export type DefaultConfigs = {
    [key in Module]?: ModuleConfig;
}


// --- Types pour les modules spécifiques ---

export interface InteractiveChannel {
    id: string;
    theme: string;
}

export interface KnowledgeBaseItem {
    id: string;
    question: string;
    answer: string;
}

export interface Persona {
    id: string;
    guild_id: string;
    name: string;
    persona_prompt: string;
    creator_id: string;
    created_at: string;
    active_channel_id: string | null;
    avatar_url: string | null;
    role_id: string | null;
    bot_token?: string | null;
}

export interface ConversationHistoryItem {
    user: string; // The user's display name
    content: string;
}

export interface PersonaMemory {
    id: number;
    persona_id: string;
    user_id?: string;
    memory_type: 'fact' | 'relationship' | 'interaction_summary' | 'preference';
    content: string;
    salience_score: number;
    last_accessed_at: string;
    created_at: string;
}

export interface SanctionHistoryEntry {
    id: number;
    guild_id: string;
    user_id: string;
    moderator_id: string; // Can be a user ID or 'AUTOMOD'
    action_type: 'warn' | 'mute' | 'kick' | 'ban';
    reason?: string;
    duration_seconds?: number;
    timestamp: string;
}
