
import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';
import { differenceInDays } from 'date-fns';

// Simple Levenshtein distance function to check for similar usernames
function levenshteinDistance(a: string, b: string): number {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(bn + 1);
    for (let i = 0; i <= bn; ++i) {
        matrix[i] = [i];
    }
    const bMatrix = matrix[0];
    for (let j = 1; j <= an; ++j) {
        bMatrix[j] = j;
    }
    for (let i = 1; i <= bn; ++i) {
        for (let j = 1; j <= an; ++j) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[bn][an];
}

async function checkAccountAge(member: GuildMember, config: any, alertChannel: TextChannel, logChannel?: TextChannel) {
    if (!config.account_age_check_enabled) return;

    const accountAgeDays = differenceInDays(new Date(), member.user.createdAt);
    if (accountAgeDays <= config.account_age_threshold_days) {
        const embed = new EmbedBuilder()
            .setColor(0xFFA500) // Orange
            .setTitle('🚨 Alerte de Sécurité : Nouveau Compte')
            .setDescription(`Un utilisateur avec un compte suspectement jeune a rejoint le serveur.`)
            .addFields(
                { name: 'Utilisateur', value: member.toString(), inline: true },
                { name: 'Âge du compte', value: `${accountAgeDays} jour(s)`, inline: true },
                { name: 'Date de création', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:f>`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `ID: ${member.id}`});

        await alertChannel.send({ embeds: [embed] });
        if(logChannel) await logChannel.send({ embeds: [embed] });
    }
}

async function checkSimilarUsername(member: GuildMember, config: any, alertChannel: TextChannel, logChannel?: TextChannel) {
    if (!config.similar_username_check_enabled) return;

    const members = await member.guild.members.fetch();
    const threshold = 1 - (config.similar_username_sensitivity / 100);

    for (const existingMember of members.values()) {
        if (existingMember.id === member.id) continue;

        const distance = levenshteinDistance(member.displayName.toLowerCase(), existingMember.displayName.toLowerCase());
        const length = Math.max(member.displayName.length, existingMember.displayName.length);
        const similarity = length > 0 ? (length - distance) / length : 1;
        
        if (similarity >= (1 - threshold)) {
             const embed = new EmbedBuilder()
                .setColor(0xFFA500) // Orange
                .setTitle('🚨 Alerte de Sécurité : Nom Similaire')
                .setDescription(`Un utilisateur a rejoint avec un nom très similaire à un membre existant.`)
                .addFields(
                    { name: 'Nouveau Membre', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Membre Existant', value: `${existingMember.user.tag} (${existingMember.id})`, inline: true },
                    { name: 'Score de Similarité', value: `${Math.round(similarity * 100)}%`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${member.id}`});

            await alertChannel.send({ embeds: [embed] });
            if(logChannel) await logChannel.send({ embeds: [embed] });
            return; // Only alert once per join
        }
    }
}


export const name = Events.GuildMemberAdd;
export async function execute(member: GuildMember) {
    if (member.user.bot) return;

    const securityConfig = await getServerConfig(member.guild.id, 'security-alerts');
    const logsConfig = await getServerConfig(member.guild.id, 'logs');

    if (!securityConfig?.enabled || !securityConfig.alert_channel_id) return;
    
    const alertChannel = await member.guild.channels.fetch(securityConfig.alert_channel_id).catch(() => null) as TextChannel;
    if (!alertChannel) return;
    
    const logChannel = logsConfig?.enabled && logsConfig.log_channel_id 
        ? await member.guild.channels.fetch(logsConfig.log_channel_id).catch(() => null) as TextChannel
        : undefined;

    await checkAccountAge(member, securityConfig, alertChannel, logChannel);
    await checkSimilarUsername(member, securityConfig, alertChannel, logChannel);
}
