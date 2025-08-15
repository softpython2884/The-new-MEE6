
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, Collection, Role, CategoryChannel, ChannelType } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig } from '../../../src/lib/db';
import { serverBuilderFlow } from '../../../src/ai/flows/server-builder-flow';


const IAEditServCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('iaeditserv')
        .setDescription('Modifie la structure du serveur avec l\'aide de l\'IA.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('request')
                .setDescription('Décrivez les modifications à apporter (ex: "ajoute un salon #annonces").')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        await interaction.deferReply({ ephemeral: true });

        const serverBuilderConfig = await getServerConfig(interaction.guild.id, 'server-builder');

        if (!serverBuilderConfig?.enabled || !serverBuilderConfig.premium) {
            await interaction.editReply({ content: "Le module Server Builder IA est désactivé ou non-premium sur ce serveur." });
            return;
        }

        const request = interaction.options.getString('request', true);

        try {
            await interaction.editReply({ content: `🤖 L'IA réfléchit aux modifications à apporter pour votre requête : "${request}"... Veuillez patienter.` });
            
            const newStructure = await serverBuilderFlow({
                guildId: interaction.guild.id,
                request: request,
                mode: 'edit', // The key difference: we are in 'edit' mode
            });

            await interaction.editReply({ content: '🏗️ Structure modifiée reçue ! Début de l'application des changements... (Cela peut prendre quelques minutes)' });

            const guild = interaction.guild;
            const progressUpdates = [];

            // Apply structure changes
            // 1. Roles
            const createdRoles = new Collection<string, Role>();
            for (const roleData of newStructure.roles) {
                const existingRole = guild.roles.cache.find(r => r.name === roleData.name);
                if (existingRole) {
                    // TODO: Logic to update existing role properties if they differ
                    createdRoles.set(roleData.name, existingRole);
                    continue;
                }
                try {
                    const newRole = await guild.roles.create({
                        name: roleData.name,
                        color: roleData.color as `#${string}` || '#000000',
                        hoist: roleData.hoist,
                        mentionable: roleData.mentionable,
                    });
                    createdRoles.set(roleData.name, newRole);
                    progressUpdates.push(`✅ Rôle "${roleData.name}" créé.`);
                } catch (e) {
                     progressUpdates.push(`❌ Erreur lors de la création du rôle "${roleData.name}".`);
                }
            }
             await interaction.editReply({ content: `🏗️ Application des changements...\n${progressUpdates.join('\n')}` });


            // 2. Categories
            const createdCategories = new Collection<string, CategoryChannel>();
            for (const catData of newStructure.categories) {
                 const existingCategory = guild.channels.cache.find(c => c.name === catData.name && c.type === ChannelType.GuildCategory);
                 if (existingCategory) {
                    // TODO: Logic to update existing category properties
                    createdCategories.set(catData.name, existingCategory as CategoryChannel);
                    continue;
                 }
                try {
                    const newCategory = await guild.channels.create({
                        name: catData.name,
                        type: ChannelType.GuildCategory,
                    });
                    createdCategories.set(catData.name, newCategory);
                    progressUpdates.push(`✅ Catégorie "${catData.name}" créée.`);
                } catch (e) {
                    progressUpdates.push(`❌ Erreur lors de la création de la catégorie "${catData.name}".`);
                }
            }
             await interaction.editReply({ content: `🏗️ Application des changements...\n${progressUpdates.join('\n')}` });

            // 3. Channels
            for (const channelData of newStructure.channels) {
                const parentCategory = createdCategories.get(channelData.category || '') || guild.channels.cache.find(c => c.name === channelData.category && c.type === ChannelType.GuildCategory) as CategoryChannel;
                const existingChannel = guild.channels.cache.find(c => c.name === channelData.name);
                if (existingChannel) {
                    // TODO: Logic to update existing channel properties
                    continue;
                }

                try {
                    await guild.channels.create({
                        name: channelData.name,
                        type: channelData.type === 'text' ? ChannelType.GuildText : ChannelType.GuildVoice,
                        topic: channelData.topic || '',
                        nsfw: channelData.nsfw || false,
                        parent: parentCategory?.id,
                    });
                    progressUpdates.push(`✅ Salon "${channelData.name}" créé.`);
                } catch (e) {
                     progressUpdates.push(`❌ Erreur lors de la création du salon "${channelData.name}".`);
                }
            }
            
            const finalEmbed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('🚀 Modification du Serveur Terminée !')
                .setDescription(`La structure de votre serveur a été modifiée selon votre demande.`)
                .addFields({ name: 'Résumé des actions', value: progressUpdates.length > 0 ? progressUpdates.slice(-20).join('\n') : "Aucun nouvel élément n'a été créé." });
                
            await interaction.editReply({ content: '', embeds: [finalEmbed] });

        } catch (error) {
            console.error('[IAEditServ] Error during server edit flow:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur de Modification')
                .setDescription('Une erreur est survenue lors de la communication avec l\'IA ou de la modification du serveur. Veuillez réessayer.');
            await interaction.editReply({ content: '', embeds: [errorEmbed] });
        }
    },
};

export default IAEditServCommand;
