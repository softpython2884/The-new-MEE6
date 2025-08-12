import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
    // TODO: Fetch configuration from database for this server (member.guild.id)
    // const config = await db.getLogConfig(member.guild.id);
    // if (!config || !config.log_members || !config.log_channel_id) return;
    const mockConfig = { log_members: true, log_channel_id: 'YOUR_LOG_CHANNEL_ID' }; // MOCK
    if (!mockConfig.log_members || !mockConfig.log_channel_id) return;

    const logChannel = member.guild.channels.cache.get(mockConfig.log_channel_id) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(0x57F287) // Discord Green
        .setAuthor({ name: `${member.user.tag} a rejoint`, iconURL: member.user.displayAvatarURL() })
        .setDescription(`${member.user} a rejoint le serveur.`)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
            { name: 'Nom d\'utilisateur', value: member.user.username, inline: true },
            { name: 'Mention', value: `<@${member.user.id}>`, inline: true },
            { name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:f>`, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${member.user.id}` });

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Log] Erreur lors de l'envoi du log d'arrivée de membre pour le serveur ${member.guild.id}:`, error);
    }
}
