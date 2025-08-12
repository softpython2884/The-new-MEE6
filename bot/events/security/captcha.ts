

import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
    if (member.user.bot) return;

    const captchaConfig = await getServerConfig(member.guild.id, 'captcha');

    if (!captchaConfig?.enabled || !captchaConfig.verification_channel) {
        return;
    }
    
    // Check if user already has the verified role (e.g. if they rejoined)
    if (member.roles.cache.has(captchaConfig.verified_role_id as string)) {
        return;
    }

    const verificationChannel = await member.guild.channels.fetch(captchaConfig.verification_channel as string).catch(() => null) as TextChannel;
    if (!verificationChannel) {
        console.error(`[Captcha] Verification channel with ID ${captchaConfig.verification_channel} not found.`);
        return;
    }

    console.log(`[Captcha] Starting verification process for ${member.user.tag} in ${member.guild.name}.`);

    // TODO: Generate the actual captcha (text or image) and store the answer temporarily (e.g., in a cache or DB).
    const captchaCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(`[Captcha] Generated code for ${member.user.tag}: ${captchaCode}`);

    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x3498DB) // Blue
        .setTitle(`Bienvenue sur ${member.guild.name} !`)
        .setDescription(`${member.toString()}, pour accéder au reste du serveur, veuillez compléter une simple vérification.`)
        .addFields({ name: 'Instruction', value: `Veuillez répondre à ce message avec le code que je vous ai envoyé en message privé.` })
        .setTimestamp();

    await verificationChannel.send({ embeds: [welcomeEmbed] });

    try {
        const dmEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('Processus de Vérification')
            .setDescription(`Pour vérifier que vous êtes bien un humain, veuillez entrer le code ci-dessous dans le salon #${verificationChannel.name}.`)
            .addFields({ name: 'Votre Code', value: `**\`${captchaCode}\`**` })
            .setFooter({ text: 'Ce code est sensible à la casse.'});
            
        const dmChannel = await member.createDM();

        // TODO: A more robust system would use a Collector to wait for the user's response in the verification channel.
        // This is a simplified version for now.
        await dmChannel.send({ embeds: [dmEmbed] });

    } catch (error) {
        console.error(`[Captcha] Could not send DM to ${member.user.tag}. They may have DMs disabled.`, error);
        // As a fallback, you could post the captcha directly in the verification channel,
        // but this is less secure as bots can read channel messages.
        verificationChannel.send(`${member.toString()}, je n'ai pas pu vous envoyer de message privé. Veuillez vérifier vos paramètres de confidentialité pour recevoir le code de vérification.`);
    }
}
