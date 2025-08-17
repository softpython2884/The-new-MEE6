
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
        const botMember = await member.guild.members.fetch(member.client.user.id);
        const botHighestRolePosition = botMember.roles.highest.position;

        const rolesToAdd = config.on_join_roles.filter((roleId: string) => {
            const role = member.guild.roles.cache.get(roleId);
            if (!role) {
                console.warn(`[Autorole] Le rôle avec l'ID ${roleId} n'a pas été trouvé sur le serveur ${member.guild.name}.`);
                return false;
            }
            if (role.position >= botHighestRolePosition) {
                console.warn(`[Autorole] Le bot ne peut pas assigner le rôle "${role.name}" car il est plus élevé ou égal dans la hiérarchie.`);
                return false;
            }
            return true;
        });

        if (rolesToAdd.length > 0) {
            await member.roles.add(rolesToAdd);
            console.log(`[Autorole] Attribué les rôles ${rolesToAdd.join(', ')} à ${member.user.tag} sur le serveur ${member.guild.name}.`);
        }
    } catch (error) {
        console.error(`[Autorole] Erreur lors de l'attribution de rôle à ${member.user.tag} sur ${member.guild.name}:`, error);
    }
}
