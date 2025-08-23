
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, Client } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig, getAllBotServers } from '@/lib/db';
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
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.user.id !== OWNER_ID) {
            await interaction.reply({ content: 'Cette commande est réservée au propriétaire du bot.', ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        
        const rawText = interaction.options.getString('message', true);
        const useIA = interaction.options.getBoolean('use_ia') ?? true;
        const client = interaction.client;

        let title = 'Annonce Importante';
        let description = rawText;

        if (useIA) {
            try {
                const result = await announcementFlow({
                    rawText,
                    authorName: interaction.user.username,
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

        for (const server of allServers) {
            try {
                const config = await getServerConfig(server.id, 'announcements');
                if (config && config.bot_announcement_channel_id) {
                    const channel = await client.channels.fetch(config.bot_announcement_channel_id) as TextChannel;
                    if (channel) {
                        await channel.send({ embeds: [embed] });
                        successCount++;
                    } else {
                        failCount++;
                    }
                } else {
                    failCount++;
                }
            } catch (error) {
                console.warn(`[AdminAnnounce] Impossible d'envoyer l'annonce au serveur ${server.id}:`, error);
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
