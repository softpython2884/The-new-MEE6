
import { Events, Guild, TextChannel, EmbedBuilder, ChannelType, Client } from 'discord.js';
import { setupDefaultConfigs } from '@/lib/db';
import { updateGuildCommands } from '../../handlers/commandHandler';

/**
 * This event handler is triggered whenever the bot joins a new guild.
 * It ensures that the new guild is immediately set up with all the
 * default configurations for every module, sends a welcome message,
 * and deploys all guild-specific slash commands.
 */
export const name = Events.GuildCreate;

export async function execute(guild: Guild, client: Client) {
    console.log(`[+] Joined a new guild: ${guild.name} (${guild.id}).`);
    
    // --- 1. Setup Database ---
    console.log(`[Database] Setting up default configurations for ${guild.name}...`);
    try {
        await setupDefaultConfigs(guild.id);
        console.log(`[Database] Successfully set up default configurations for ${guild.name}.`);
    } catch (error) {
        console.error(`[Database] Failed to set up default configurations for guild ${guild.id}:`, error);
    }
    
    // --- 2. Deploy Guild Commands ---
    // This is crucial to make commands available immediately on join.
    console.log(`[Commands] Deploying commands for the new guild: ${guild.name}`);
    await updateGuildCommands(guild.id, client);


    // --- 3. Send Welcome Message ---
    let welcomeChannel: TextChannel | undefined;

    // Find the first available text channel where we can send messages
    try {
        welcomeChannel = guild.channels.cache.find(channel => 
            channel.type === ChannelType.GuildText && 
            guild.members.me?.permissionsIn(channel).has('SendMessages')
        ) as TextChannel;

        if (welcomeChannel) {
            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`👋 Merci de m'avoir ajouté sur ${guild.name} !`)
                .setDescription(`Bonjour ! Je suis **Marcus**, votre nouvel assistant pour gérer et animer votre serveur.`)
                .addFields(
                    { 
                        name: '🚀 Pour commencer', 
                        value: 'Pour accéder au panel de configuration web, un administrateur doit simplement taper la commande suivante dans n\'importe quel salon :\n\n`/login`\n\nCela générera un lien de connexion unique et sécurisé pour configurer tous mes modules.',
                    },
                    {
                        name: '✨ Ce que je peux faire',
                        value: '- Modération complète et auto-modération\n- Sécurité avancée (Anti-Raid, Anti-Bot)\n- Fonctionnalités IA exclusives (et bien plus encore !)'
                    }
                )
                .setFooter({ text: 'J\'ai hâte de vous aider !' });

            await welcomeChannel.send({ embeds: [welcomeEmbed] });
            console.log(`[Welcome] Sent introduction message to #${welcomeChannel.name} in ${guild.name}.`);
        } else {
             console.log(`[Welcome] Could not find a suitable channel to send a welcome message in ${guild.name}.`);
        }
    } catch (error) {
        console.error(`[Welcome] Failed to send welcome message to guild ${guild.id}:`, error);
    }
}
