
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig, getPersonasForGuild, updatePersona } from '@/lib/db';

const PersonnageCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('personnage')
        .setDescription('Gère les personnages IA sur le serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('activer')
                .setDescription("Active un personnage dans le salon actuel.")
                .addStringOption(option => 
                    option.setName('nom')
                        .setDescription('Le nom du personnage à activer.')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('desactiver')
                .setDescription("Désactive le personnage actif dans ce salon.")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('liste')
                .setDescription("Affiche la liste de tous les personnages créés.")
        ),
    
    async autocomplete(interaction) {
        if (!interaction.guildId) return;
        const focusedValue = interaction.options.getFocused();
        const personas = getPersonasForGuild(interaction.guildId);
        const choices = personas
            .filter(p => p.name.toLowerCase().startsWith(focusedValue.toLowerCase()))
            .map(p => ({ name: p.name, value: p.id }));
        
        await interaction.respond(choices.slice(0, 25));
    },

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const config = await getServerConfig(interaction.guild.id, 'ai-personas');
        if (!config?.enabled || !config.premium) {
            await interaction.reply({ content: "Le module Personnages IA est désactivé ou non-premium sur ce serveur.", flags: MessageFlags.Ephemeral });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const personas = getPersonasForGuild(interaction.guild.id);
        
        switch (subcommand) {
            case 'activer': {
                await interaction.deferReply({ ephemeral: true });
                const personaId = interaction.options.getString('nom', true);
                const persona = personas.find(p => p.id === personaId);

                if (!persona) {
                    await interaction.editReply({ content: `Personnage non trouvé. Veuillez utiliser l'auto-complétion.` });
                    return;
                }
                
                // Desactivate any other persona that might be active in this channel
                const alreadyActive = personas.find(p => p.active_channel_id === interaction.channelId);
                if (alreadyActive && alreadyActive.id !== persona.id) {
                    updatePersona(alreadyActive.id, { active_channel_id: null });
                }

                updatePersona(persona.id, { active_channel_id: interaction.channelId });
                await interaction.editReply({ content: `✅ **${persona.name}** est maintenant actif dans ce salon.` });
                break;
            }
            case 'desactiver': {
                 await interaction.deferReply({ ephemeral: true });
                 const activePersonaInChannel = personas.find(p => p.active_channel_id === interaction.channelId);
                 if (!activePersonaInChannel) {
                     await interaction.editReply({ content: "Aucun personnage n'est actif dans ce salon." });
                     return;
                 }
                 updatePersona(activePersonaInChannel.id, { active_channel_id: null });
                 await interaction.editReply({ content: `✅ **${activePersonaInChannel.name}** a été désactivé de ce salon.` });
                break;
            }
            case 'liste': {
                await interaction.deferReply({ ephemeral: true });
                 if (personas.length === 0) {
                    await interaction.editReply({ content: "Aucun personnage n'a été créé pour ce serveur. Rendez-vous sur le panel pour en créer !" });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor(0x8e44ad)
                    .setTitle(`🎭 Personnages IA de ${interaction.guild.name}`)
                    .setDescription(personas.map(p => `**- ${p.name}** (ID: \`${p.id}\`)${p.active_channel_id ? ` - Actif dans <#${p.active_channel_id}>` : ''}`).join('\n'))
                    .setFooter({text: "Gérez vos personnages depuis le panel."});

                await interaction.editReply({ embeds: [embed] });
                break;
            }
        }
    },
};

export default PersonnageCommand;
