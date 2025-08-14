
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, Collection, Role, CategoryChannel, TextChannel, VoiceChannel, ChannelType, OverwriteResolvable } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig } from '@/lib/db';
import { serverBuilderFlow } from '@/ai/flows/server-builder-flow';


const IACreateServCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('iacreateserv')
        .setDescription('Génère une structure de serveur complète avec l\'IA.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('theme')
                .setDescription('Le thème de base pour la génération du serveur.')
                .setRequired(true)
                .addChoices(
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'Professionnel', value: 'pro' },
                    { name: 'Roleplay', value: 'rp' },
                    { name: 'Communauté', value: 'community' },
                    { name: 'Streaming', value: 'stream' }
                ))
        .addStringOption(option =>
            option.setName('detail_level')
                .setDescription('Le niveau de détail de la structure à générer.')
                .setRequired(false)
                 .addChoices(
                    { name: 'Minimal', value: 'minimal' },
                    { name: 'Standard', value: 'standard' },
                    { name: 'Complet', value: 'full' }
                )),

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

        const theme = interaction.options.getString('theme', true);
        const detailLevel = interaction.options.getString('detail_level') || 'standard';
        const request = `Create a Discord server with a '${theme}' theme and a '${detailLevel}' level of detail.`;

        try {
            await interaction.editReply({ content: '🤖 L\'IA réfléchit à la structure parfaite pour votre serveur... Veuillez patienter.' });
            
            const newStructure = await serverBuilderFlow({
                guildId: interaction.guild.id,
                request: request,
                mode: 'create',
            });

            await interaction.editReply({ content: '🏗️ Structure reçue ! Début de la construction... (Cela peut prendre quelques minutes)' });

            const guild = interaction.guild;
            const progressUpdates = [];

            // Apply structure
            // 1. Roles
            const createdRoles = new Collection<string, Role>();
            for (const roleData of newStructure.roles) {
                const existingRole = guild.roles.cache.find(r => r.name === roleData.name);
                if (existingRole) {
                    createdRoles.set(roleData.name, existingRole);
                    continue;
                }
                try {
                    const newRole = await guild.roles.create({
                        name: roleData.name,
                        color: roleData.color as `#${string}` || '#000000',
                        hoist: roleData.hoist,
                        mentionable: roleData.mentionable,
                        // permissions: roleData.permissions, // Permissions need careful mapping
                    });
                    createdRoles.set(roleData.name, newRole);
                    progressUpdates.push(`✅ Rôle "${roleData.name}" créé.`);
                } catch (e) {
                     progressUpdates.push(`❌ Erreur lors de la création du rôle "${roleData.name}".`);
                }
            }
             await interaction.editReply({ content: `🏗️ Construction...\n${progressUpdates.join('\n')}` });


            // 2. Categories
            const createdCategories = new Collection<string, CategoryChannel>();
            for (const catData of newStructure.categories) {
                 const existingCategory = guild.channels.cache.find(c => c.name === catData.name && c.type === ChannelType.GuildCategory);
                 if (existingCategory) {
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
             await interaction.editReply({ content: `🏗️ Construction...\n${progressUpdates.join('\n')}` });

            // 3. Channels
            for (const channelData of newStructure.channels) {
                const parentCategory = createdCategories.get(channelData.category || '');
                 const existingChannel = guild.channels.cache.find(c => c.name === channelData.name);
                 if (existingChannel) continue;

                try {
                    await guild.channels.create({
                        name: channelData.name,
                        type: channelData.type === 'text' ? ChannelType.GuildText : ChannelType.GuildVoice,
                        topic: channelData.topic || '',
                        nsfw: channelData.nsfw || false,
                        parent: parentCategory?.id,
                        // permissionOverwrites: channelData.overwrites, // Permissions need careful mapping
                    });
                    progressUpdates.push(`✅ Salon "${channelData.name}" créé.`);
                } catch (e) {
                     progressUpdates.push(`❌ Erreur lors de la création du salon "${channelData.name}".`);
                }
            }
            
            const finalEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🚀 Construction du Serveur Terminée !')
                .setDescription(`La structure de votre serveur sur le thème **${theme}** a été générée et appliquée.`)
                .addFields({ name: 'Résumé des actions', value: progressUpdates.slice(-20).join('\n') }); // Show last 20 actions
                
            await interaction.editReply({ content: '', embeds: [finalEmbed] });

        } catch (error) {
            console.error('[IACreateServ] Error during server creation flow:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Erreur de Construction')
                .setDescription('Une erreur est survenue lors de la communication avec l\'IA ou de la construction du serveur. Veuillez réessayer.');
            await interaction.editReply({ content: '', embeds: [errorEmbed] });
        }
    },
};

export default IACreateServCommand;
