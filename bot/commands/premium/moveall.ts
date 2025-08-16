
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ChannelType, VoiceChannel, Collection, GuildMember } from 'discord.js';
import type { Command } from '../../../src/types';
import { getServerConfig, checkTesterStatus } from '../../../src/lib/db';

const MoveAllCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('moveall')
        .setDescription('Déplace en masse des utilisateurs en vocal. (Premium / Testeur)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('from_channel')
                .setDescription('Déplace tous les utilisateurs d\'un salon vocal spécifique.')
                .addChannelOption(option =>
                    option.setName('source')
                        .setDescription('Le salon vocal source.')
                        .addChannelTypes(ChannelType.GuildVoice)
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('destination')
                        .setDescription('Le salon vocal de destination.')
                        .addChannelTypes(ChannelType.GuildVoice)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('from_server')
                .setDescription('Déplace tous les utilisateurs de tous les salons vocaux.')
                .addChannelOption(option =>
                    option.setName('destination')
                        .setDescription('Le salon vocal de destination.')
                        .addChannelTypes(ChannelType.GuildVoice)
                        .setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'Cette commande ne peut être utilisée que dans un serveur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const moveallConfig = await getServerConfig(interaction.guild.id, 'moveall');
        const testerStatus = checkTesterStatus(interaction.user.id, interaction.guild.id);

        if (!moveallConfig?.premium && !testerStatus.isTester) {
            await interaction.reply({ content: "Cette commande est réservée aux serveurs Premium ou aux utilisateurs Testeurs.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const destinationChannel = interaction.options.getChannel('destination') as VoiceChannel;

        if (!destinationChannel || destinationChannel.type !== ChannelType.GuildVoice) {
            await interaction.editReply({ content: 'Le salon de destination doit être un salon vocal valide.' });
            return;
        }

        let membersToMove: Collection<string, GuildMember> = new Collection();
        let sourceDescription = '';

        if (subcommand === 'from_channel') {
            const sourceChannel = interaction.options.getChannel('source') as VoiceChannel;
            if (!sourceChannel || sourceChannel.type !== ChannelType.GuildVoice) {
                await interaction.editReply({ content: 'Le salon source doit être un salon vocal valide.' });
                return;
            }
            if (sourceChannel.id === destinationChannel.id) {
                await interaction.editReply({ content: 'Le salon source et de destination ne peuvent pas être les mêmes.' });
                return;
            }
            membersToMove = sourceChannel.members.filter(m => !m.user.bot);
            sourceDescription = `du salon **${sourceChannel.name}**`;

        } else if (subcommand === 'from_server') {
            const allVoiceChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice && c.id !== destinationChannel.id) as Collection<string, VoiceChannel>;
            allVoiceChannels.forEach(channel => {
                channel.members.filter(m => !m.user.bot).forEach(member => {
                    membersToMove.set(member.id, member);
                });
            });
            sourceDescription = `de tout le serveur`;
        }

        if (membersToMove.size === 0) {
            await interaction.editReply({ content: 'Aucun utilisateur à déplacer.' });
            return;
        }

        let movedCount = 0;
        let errorCount = 0;

        const movePromises = membersToMove.map(async (member) => {
            try {
                await member.voice.setChannel(destinationChannel, `Déplacé par ${interaction.user.tag}`);
                movedCount++;
            } catch (error) {
                console.error(`[MoveAll] Impossible de déplacer ${member.user.tag}:`, error);
                errorCount++;
            }
        });

        await Promise.all(movePromises);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Déplacement de Masse Terminé')
            .setDescription(`**${movedCount}** utilisateur(s) ont été déplacé(s) avec succès ${sourceDescription} vers **${destinationChannel.name}**.`)
            .setFooter({ text: `Opération effectuée par ${interaction.user.tag}` });
        
        if (errorCount > 0) {
            embed.addFields({ name: 'Erreurs', value: `${errorCount} utilisateur(s) n'ont pas pu être déplacé(s).`});
            embed.setColor(0xFFA500);
        }
            
        await interaction.editReply({ embeds: [embed] });
    },
};

export default MoveAllCommand;
