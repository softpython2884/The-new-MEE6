
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, Client, SystemChannelFlagsBitField, SystemChannelFlags, APIPartialChannel } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig, getAllBotServers, getGlobalAiStatus } from '@/lib/db';
import { announcementFlow } from '@/ai/flows/announcement-flow';

const OWNER_ID = '556529963877138442';

const AdminAnnounceCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('adminannounce')
        .setDescription('Envoie une annonce à tous les serveurs. (Propriétaire seulement)')
        .setDMPermission(true)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le contenu de l\'annonce à envoyer.')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('use_ia')
                .setDescription('Mettre en forme le message avec l\'IA ? (Oui par défaut)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('langue')
                .setDescription('Traduire l\'annonce dans une langue spécifique ? (Optionnel)')
                .setRequired(false)
                 .addChoices(
                    { name: 'Anglais', value: 'English' },
                    { name: 'Français', value: 'French' },
                    { name: 'Espagnol', value: 'Spanish' }
                )),

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.user.id !== OWNER_ID) {
            await interaction.reply({ content: 'Cette commande est réservée au propriétaire du bot.', ephemeral: true });
            return;
        }
        
        const globalAiStatus = getGlobalAiStatus();
        if (globalAiStatus.disabled) {
            await interaction.reply({ content: `Les fonctionnalités IA sont désactivées globalement. Raison : ${globalAiStatus.reason}`, ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        
        const rawText = interaction.options.getString('message', true);
        const useIA = interaction.options.getBoolean('use_ia') ?? true;
        const targetLanguage = interaction.options.getString('langue');
        const client = interaction.client;

        let title = 'Annonce Importante';
        let description = rawText;

        if (useIA) {
            try {
                const result = await announcementFlow({
                    rawText,
                    authorName: interaction.user.username,
                    targetLanguage: targetLanguage || undefined,
                });
                title = `📢 ${result.title}`;
                description = result.description;
            } catch (error) {
                console.error('[AdminAnnounce] Erreur de l\'IA, envoi du texte brut.', error);
                await interaction.editReply({ content: `⚠️ L'IA a échoué. Le message brut sera envoyé.` });
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(0x5865F2)
            .setFooter({ text: `Annonce de la part de l'équipe de ${client.user?.username}`, iconURL: client.user?.displayAvatarURL() || undefined })
            .setTimestamp();

        const allServers = getAllBotServers();
        let successCount = 0;
        let failCount = 0;

        await interaction.editReply({ content: `Envoi de l'annonce à ${allServers.length} serveurs...` });

        for (const serverId of allServers.map(s => s.id)) {
            try {
                const guild = await client.guilds.fetch(serverId).catch(() => null);
                if (!guild) {
                    failCount++;
                    continue;
                }

                const config = await getServerConfig(guild.id, 'announcements');
                let targetChannel: TextChannel | null = null;
                let isFallback = false;

                // 1. Try dedicated announcement channel
                if (config && config.bot_announcement_channel_id) {
                    targetChannel = await client.channels.fetch(config.bot_announcement_channel_id).catch(() => null) as TextChannel;
                }

                // 2. If not found, try welcome channel
                if (!targetChannel) {
                    const welcomeConfig = await getServerConfig(guild.id, 'welcome-message');
                    if (welcomeConfig && welcomeConfig.welcome_channel_id) {
                         targetChannel = await client.channels.fetch(welcomeConfig.welcome_channel_id).catch(() => null) as TextChannel;
                         if (targetChannel) isFallback = true;
                    }
                }
                
                // 3. If not found, try system channel
                if (!targetChannel && guild.systemChannel && !guild.systemChannel.flags.has(SystemChannelFlags.SuppressJoinNotifications)) {
                     targetChannel = guild.systemChannel;
                     if (targetChannel) isFallback = true;
                }

                // 4. If not found, find first writable text channel
                if (!targetChannel) {
                    targetChannel = guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me!)?.has('SendMessages')) as TextChannel;
                     if (targetChannel) isFallback = true;
                }
                
                // Send the message
                if (targetChannel) {
                    let messageContent = isFallback 
                        ? "Message de l'équipe du bot (veuillez configurer un salon d'annonce dédié via le panel pour éviter ce message)." 
                        : "";
                    await targetChannel.send({ content: messageContent, embeds: [embed] });
                    successCount++;
                } else {
                    failCount++;
                }

            } catch (error) {
                console.warn(`[AdminAnnounce] Impossible d'envoyer l'annonce au serveur ${serverId}:`, error);
                failCount++;
            }
        }

        await interaction.followUp({
            content: `✅ Annonce envoyée avec succès à **${successCount}** serveurs. Échec pour **${failCount}** serveurs (salon non configuré ou permissions manquantes).`,
            ephemeral: true,
        });
    },
};

export default AdminAnnounceCommand;
