
import { Events, GuildMember } from 'discord.js';
import { giveTesterStatus, revokeTesterStatus } from '../../../src/lib/db';

const TARGET_GUILD_ID = '926602935054508032';

export const name = Events.GuildMemberUpdate;

export async function execute(oldMember: GuildMember, newMember: GuildMember) {
    // Only run for the target guild
    if (newMember.guild.id !== TARGET_GUILD_ID) {
        return;
    }

    const wasBoosting = oldMember.premiumSinceTimestamp !== null;
    const isBoosting = newMember.premiumSinceTimestamp !== null;

    // User started boosting
    if (!wasBoosting && isBoosting) {
        console.log(`[Tester] ${newMember.user.tag} a commencé à booster ${newMember.guild.name}. Statut de Testeur accordé.`);
        // Give tester status with no expiration date (tied to boost)
        giveTesterStatus(newMember.id, newMember.guild.id, null);
        
        try {
            await newMember.send('🎉 Merci d\'avoir boosté le serveur ! En guise de remerciement, vous avez obtenu le statut de **Testeur**, vous donnant accès à des fonctionnalités exclusives.');
        } catch (error) {
            console.warn(`[Tester] Impossible d'envoyer un DM de remerciement à ${newMember.user.tag}.`);
        }
    } 
    // User stopped boosting
    else if (wasBoosting && !isBoosting) {
        console.log(`[Tester] ${newMember.user.tag} a arrêté de booster ${newMember.guild.name}. Statut de Testeur révoqué.`);
        revokeTesterStatus(newMember.id, newMember.guild.id);
        
         try {
            await newMember.send('Vous avez arrêté de booster le serveur. Votre statut de **Testeur** et l'accès aux fonctionnalités exclusives ont été retirés. Merci pour votre soutien passé !');
        } catch (error) {
            console.warn(`[Tester] Impossible d'envoyer un DM de notification à ${newMember.user.tag}.`);
        }
    }
}
