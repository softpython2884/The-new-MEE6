
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '@/types';
import { getServerConfig, createPersona } from '@/lib/db';
import { generatePersonaPrompt } from '@/ai/flows/persona-flow';
import { v4 as uuidv4 } from 'uuid';


const PersonnageCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('personnage')
        .setDescription('Gère les personnages IA sur le serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('creer')
                .setDescription("Crée un nouveau personnage IA.")
                .addStringOption(option => 
                    option.setName('nom')
                        .setDescription('Le nom du personnage.')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('instructions')
                        .setDescription('Instructions de base pour la personnalité (ex: "Une fille de 19 ans un peu timide").')
                        .setRequired(false)))
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
        
        switch (subcommand) {
            case 'creer':
                await handleCreate(interaction);
                break;
            // Autres cas à implémenter
            default:
                await interaction.reply({ content: `La sous-commande \`${subcommand}\` n'est pas encore implémentée.`, flags: MessageFlags.Ephemeral });
        }
    },
};

async function handleCreate(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const name = interaction.options.getString('nom', true);
    const instructions = interaction.options.getString('instructions') || 'Une personnalité IA standard.';

    try {
        await interaction.editReply({ content: `🧠 L'IA imagine la personnalité de **${name}**... Un instant.` });

        const personaPrompt = await generatePersonaPrompt({ name, instructions });

        const newPersona = {
            id: uuidv4(),
            guild_id: interaction.guild!.id,
            name: name,
            persona_prompt: personaPrompt,
            creator_id: interaction.user.id,
            active_channel_id: null,
        };

        createPersona(newPersona);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`✅ Personnage Créé : ${name}`)
            .setDescription("Voici la fiche de personnage générée par l'IA. Vous pouvez maintenant l'activer dans un salon avec la commande `/personnage activer`.")
            .addFields({ name: 'Personnalité', value: personaPrompt.substring(0, 1024) })
            .setFooter({ text: `ID: ${newPersona.id}` });
        
        await interaction.editReply({ content: '', embeds: [embed] });

    } catch (error) {
        console.error('[PersonnageCreate] Error:', error);
        await interaction.editReply({ content: 'Une erreur est survenue lors de la création du personnage.' });
    }
}


export default PersonnageCommand;
