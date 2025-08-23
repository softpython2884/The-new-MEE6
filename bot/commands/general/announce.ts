
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, TextChannel } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';
import { announcementFlow } from '@/ai/flows/announcement-flow';

const AnnounceCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Crée et publie une annonce dans le salon configuré.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le contenu de votre annonce (sera mis en forme par l\'IA).')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'announcements');
        if (!config?.enabled) {
            await interaction.reply({ content: "Le module d'annonces est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }
        if (!config.announcement_channel_id) {
            await interaction.reply({ content: "Aucun salon d'annonce n'a été configuré. Veuillez le faire dans le panel.", flags: MessageFlags.Ephemeral });
            return;
        }

        const targetChannel = await interaction.guild.channels.fetch(config.announcement_channel_id).catch(() => null) as TextChannel;
        if (!targetChannel) {
            await interaction.reply({ content: "Le salon d'annonce configuré n'existe plus.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const rawText = interaction.options.getString('message', true);

        try {
            const result = await announcementFlow({
                rawText: rawText,
                authorName: interaction.user.username,
            });

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle(result.title)
                .setDescription(result.description)
                .setAuthor({ name: `Annonce de ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() || undefined })
                .setTimestamp();

            await targetChannel.send({ embeds: [embed] });

            await interaction.editReply({ content: `✅ Votre annonce a été publiée avec succès dans ${targetChannel}.` });

        } catch (error) {
            console.error('[AnnounceCommand] Error:', error);
            await interaction.editReply({ content: "Une erreur est survenue lors de la création de l'annonce." });
        }
    },
};

export default AnnounceCommand;
