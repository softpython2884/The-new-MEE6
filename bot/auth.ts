
import fetch from 'node-fetch';

let botAccessToken: string | null = null;
let tokenExpiry: number | null = null;

// This function will be called once at bot startup
export async function initializeBotAuth() {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET must be defined in .env');
    }

    try {
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                scope: 'bot applications.commands', // Important scopes for the bot itself
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        const tokenData = await response.json() as any;

        if (!response.ok) {
            console.error('Failed to authenticate bot with Discord API:', tokenData);
            throw new Error(tokenData.error_description || 'Failed to fetch bot access token');
        }

        botAccessToken = tokenData.access_token;
        // Set expiry to be slightly less than the actual expiry to be safe
        tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000; 

        console.log('[Auth] Successfully obtained bot access token.');
    } catch (error) {
        console.error('[Auth] Error during bot authentication:', error);
        throw error; // Re-throw to prevent the bot from starting in a bad state
    }
}

// Function to get the current token, refreshing if necessary
export async function getBotAccessToken(): Promise<string> {
    if (!botAccessToken || (tokenExpiry && Date.now() > tokenExpiry)) {
        console.log('[Auth] Bot access token is expired or missing. Re-authenticating...');
        await initializeBotAuth();
    }
    return botAccessToken!;
}
