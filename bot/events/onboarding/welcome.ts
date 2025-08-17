
import { Events, GuildMember, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

// Le nom de l'événement Discord que nous écoutons
export const name = Events.GuildMemberAdd;

// La fonction qui sera exécutée
export async function execute(member: GuildMember) {
    // Ignore les bots
    if (member.user.bot) return;

    // 1. Récupérer la configuration du module pour ce serveur
    const config = await getServerConfig(member.guild.id, 'welcome-message');

    // 2. Vérifier si le module est activé et bien configuré
    if (!config?.enabled || !config.welcome_channel_id) {
        return;
    }

    // 3. Récupérer le salon configuré
    const channel = await member.guild.channels.fetch(config.welcome_channel_id).catch(() => null) as TextChannel;
    if (!channel) return;

    // 4. Préparer et envoyer le message
    const message = config.welcome_message.replace('{user}', member.toString());
    await channel.send(message);
}
