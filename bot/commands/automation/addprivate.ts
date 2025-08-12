

import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';

const AddPrivateCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('addprivate')
        .setDescription('Envoie le panneau de création de salon privé dans le salon configuré.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', ephemeral: true });
            return;
        }

        const privateRoomsConfig = await getServerConfig(interaction.guild.id, 'private-rooms');

        if (!privateRoomsConfig?.enabled) {
            await interaction.reply({ content: "Le module de salons privés est désactivé sur ce serveur.", ephemeral: true });
            return;
        }
        
        if (!privateRoomsConfig.creation_channel) {
            await interaction.reply({ content: "Aucun salon de création n'a été configuré. Veuillez le définir dans le dashboard.", ephemeral: true });
            return;
        }
        
        // TODO: In a real implementation, you would send a message with a button to the creation_channel.
        // For example:
        // const channel = await interaction.guild.channels.fetch(privateRoomsConfig.creation_channel);
        // const embed = new EmbedBuilder()...
        // const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('create_private_room')...);
        // await channel.send({ embeds: [embed], components: [row] });

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`✅ Le panneau de création de salon privé serait envoyé dans le salon <#${privateRoomsConfig.creation_channel}>. (Implémentation à venir)`);
            
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

export default AddPrivateCommand;
