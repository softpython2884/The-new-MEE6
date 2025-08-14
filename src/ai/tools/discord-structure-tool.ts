
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { REST } from '@discordjs/rest';
import { Routes, APIUser, APIRole, APIChannel } from 'discord-api-types/v10';
import { getBotAccessToken } from '../../../bot/auth';

const rest = new REST({ version: '10' });

const GetServerStructureSchema = z.object({
  guildId: z.string().describe('The ID of the Discord server.'),
});

// Using a simplified schema for the tool's output for clarity
const ToolOutputSchema = z.object({
  roles: z.array(z.any()),
  channels: z.array(z.any()),
});


export const getServerStructure = ai.defineTool(
    {
        name: 'getServerStructure',
        description: 'Fetches the current structure of a Discord server, including roles and channels.',
        inputSchema: GetServerStructureSchema,
        outputSchema: ToolOutputSchema,
    },
    async ({ guildId }) => {
        try {
            const token = await getBotAccessToken();
            rest.setToken(token);

            console.log(`[Tool] Fetching structure for guild ${guildId}`);

            const [roles, channels] = await Promise.all([
                rest.get(Routes.guildRoles(guildId)) as Promise<APIRole[]>,
                rest.get(Routes.guildChannels(guildId)) as Promise<APIChannel[]>,
            ]);

            return {
                roles,
                channels,
            };
        } catch (error) {
            console.error(`[Tool] Error fetching server structure for ${guildId}:`, error);
            // Return empty structure on error
            return { roles: [], channels: [] };
        }
    }
);
