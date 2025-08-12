
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
    | 'backup';

export interface ModuleConfig {
  [key: string]: any; // Pour une flexibilité maximale
}

export type DefaultConfigs = {
    [key in Module]?: ModuleConfig;
}


// --- Types pour les modules spécifiques ---

export interface InteractiveChannel {
    id: string;
    theme: 'gaming' | 'social' | 'music';
}

export interface KnowledgeBaseItem {
    id: string;
    question: string;
    answer: string;
}
