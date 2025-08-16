

import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-server-configuration.ts';
import '@/ai/flows/image-filter-flow.ts';
import '@/ai/flows/moderation-ai-flow.ts';
import '@/ai/flows/smart-voice-flow.ts';
import '@/ai/flows/faq-flow.ts';
import '@/ai/flows/auto-translate-flow.ts';
import '@/ai/flows/moderation-ai-flow.ts';
import '@/ai/flows/content-creation-flow.ts';
import '@/ai/flows/server-builder-flow.ts';
import '@/ai/flows/conversational-agent-flow.ts';
import '@/ai/flows/keyword-generation-flow.ts';
import '@/ai/flows/persona-flow.ts';
import '@/ai/flows/memory-flow.ts';
import '@/ai/flows/self-reflection-flow.ts';

import '@/ai/tools/discord-structure-tool.ts';
