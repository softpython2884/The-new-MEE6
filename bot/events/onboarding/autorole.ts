
import { Events, GuildMember } from 'discord.js';
import { getServerConfig } from '../../../src/lib/db';

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember) {
    if (member.user.bot) return;

    const config = await getServerConfig(member.guild.id, 'autoroles');

    if (!config?.enabled || !config.on_join_roles || config.on_join_roles.length === 0) {
        return;
    }

    try {
        const rolesToAdd = config.on_join_roles.filter((roleId: string) => member.guild.roles.cache.has(roleId));

        if (rolesToAdd.length > 0) {
            await member.roles.add(rolesToAdd);
            console.log(`[Autorole] Attribué les rôles ${rolesToAdd.join(', ')} à ${member.user.tag} sur le serveur ${member.guild.name}.`);
        }
    } catch (error) {
        console.error(`[Autorole] Erreur lors de l'attribution de rôle à ${member.user.tag} sur ${member.guild.name}:`, error);
    }
}
