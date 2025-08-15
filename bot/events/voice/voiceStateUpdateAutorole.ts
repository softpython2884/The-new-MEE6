
import { Events, VoiceState } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.VoiceStateUpdate;

export async function execute(oldState: VoiceState, newState: VoiceState) {
    if (!newState.guild || !newState.member) return;
    if (newState.member.user.bot) return;

    const config = await getServerConfig(newState.guild.id, 'autoroles');

    // Check if the module is enabled and if there are roles to assign
    if (!config?.enabled || !config.on_voice_join_roles || config.on_voice_join_roles.length === 0) {
        return;
    }

    const member = newState.member;
    const rolesToAssign = config.on_voice_join_roles;

    try {
        // User joins a voice channel
        if (!oldState.channelId && newState.channelId) {
            const rolesToAdd = rolesToAssign.filter((roleId: string) => 
                !member.roles.cache.has(roleId) && newState.guild.roles.cache.has(roleId)
            );

            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
                console.log(`[Autorole Vocal] Attribué les rôles ${rolesToAdd.join(', ')} à ${member.user.tag} sur ${member.guild.name}.`);
            }
        }
        // User leaves a voice channel
        else if (oldState.channelId && !newState.channelId) {
             const rolesToRemove = rolesToAssign.filter((roleId: string) => 
                member.roles.cache.has(roleId) && newState.guild.roles.cache.has(roleId)
            );
             if (rolesToRemove.length > 0) {
                await member.roles.remove(rolesToRemove);
                console.log(`[Autorole Vocal] Retiré les rôles ${rolesToRemove.join(', ')} de ${member.user.tag} sur ${member.guild.name}.`);
            }
        }
    } catch (error) {
        console.error(`[Autorole Vocal] Erreur lors de la gestion des rôles pour ${member.user.tag}:`, error);
    }
}
