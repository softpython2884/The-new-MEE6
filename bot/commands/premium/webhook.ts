
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, User, TextChannel } from 'discord.js';
import type { Command } from '../../../src/types';
import { checkTesterStatus } from '../../../src/lib/db';

const WEBHOOK_NAME = "Marcus Impersonator";

const WebhookCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('webhook')
        .setDescription('Envoie un message via un webhook en imitant un utilisateur. (Réservé aux Testeurs)')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription("L'utilisateur à imiter (nom et avatar).")
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le message à envoyer.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('image_url')
                .setDescription("L'URL de l'image à joindre (optionnel).")
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription("Le salon où envoyer le message (par défaut, le salon actuel).")
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const testerStatus = checkTesterStatus(interaction.user.id, interaction.guild.id);
        if (!testerStatus.isTester) {
            await interaction.reply({ content: 'Cette commande est réservée aux Testeurs du bot.', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('utilisateur', true);
        const messageContent = interaction.options.getString('message', true);
        const imageUrl = interaction.options.getString('image_url');
        const targetChannel = (interaction.options.getChannel('salon') || interaction.channel) as TextChannel;

        if (!targetChannel.isTextBased()) {
             await interaction.editReply({ content: "Le salon spécifié n'est pas un salon textuel." });
            return;
        }
        
        try {
            const webhooks = await targetChannel.fetchWebhooks();
            let webhook = webhooks.find(wh => wh.name === WEBHOOK_NAME && wh.token !== null);

            if (!webhook) {
                webhook = await targetChannel.createWebhook({
                    name: WEBHOOK_NAME,
                    avatar: interaction.client.user?.displayAvatarURL(),
                    reason: 'Webhook pour la commande /webhook'
                });
            }

            await webhook.send({
                content: messageContent,
                username: targetUser.username,
                avatarURL: targetUser.displayAvatarURL(),
                files: imageUrl ? [imageUrl] : [],
            });

            await interaction.editReply({ content: `✅ Message envoyé avec succès dans ${targetChannel} en tant que **${targetUser.tag}**.` });

        } catch (error) {
            console.error(`[WebhookCommand] Could not send webhook message:`, error);
            await interaction.editReply({ content: `Impossible d'envoyer le message. Vérifiez les permissions du bot et l'URL de l'image.`});
        }
    },
};

export default WebhookCommand;
