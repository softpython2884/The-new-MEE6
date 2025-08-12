

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';

const AddPrivateCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('addprivate')
        .setDescription('Envoie le panneau de création de salon privé dans le salon configuré.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const privateRoomsConfig = await getServerConfig(interaction.guild.id, 'private-rooms');

        if (!privateRoomsConfig?.enabled) {
            await interaction.reply({ content: "Le module de salons privés est désactivé sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }
        
        if (!privateRoomsConfig.creation_channel) {
            await interaction.reply({ content: "Aucun salon de création n'a été configuré. Veuillez le définir dans le dashboard.", flags: MessageFlags.Ephemeral });
            return;
        }
        
        try {
            const channel = await interaction.guild.channels.fetch(privateRoomsConfig.creation_channel) as TextChannel;
            if (!channel) {
                await interaction.reply({ content: "Le salon de création configuré n'existe plus.", flags: MessageFlags.Ephemeral });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('Créer un salon privé')
                .setDescription(privateRoomsConfig.embed_message || 'Cliquez sur le bouton ci-dessous pour créer un salon privé.')
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() || undefined });

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_private_room')
                    .setLabel('Créer un salon')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('➕')
            );
            
            await channel.send({ embeds: [embed], components: [row] });

            await interaction.reply({ content: `✅ Le panneau de création de salon privé a été envoyé avec succès dans ${channel}.`, flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('[AddPrivate] Error sending private room panel:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'envoi du panneau.', flags: MessageFlags.Ephemeral });
        }
    },
};

export default AddPrivateCommand;
