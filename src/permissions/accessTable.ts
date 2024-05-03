import { RoleName } from "./roles";

export enum PermissionLevel {
  CanClick = 'canClick',
  CanShow = 'canShow',
}

interface ResourcePriviledges {
  [PermissionLevel.CanClick]: string[];
  [PermissionLevel.CanShow]: string[];
}

const componentPermissions: Readonly<Record<string, ResourcePriviledges>> = {
  'project/tabs/datasettab': {
    [PermissionLevel.CanShow]: [RoleName.Viewer, RoleName.ProjectAnalyst],
    [PermissionLevel.CanClick]: [RoleName.Viewer, RoleName.ProjectAnalyst],
  },
  'project/tabs/datasettab/datasettable': {
    [PermissionLevel.CanShow]: [RoleName.Viewer, RoleName.ProjectAnalyst],
    [PermissionLevel.CanClick]: [RoleName.ProjectAnalyst],
  },
};

export function hasPermission(
  roles: string[],
  domain: string,
  permission: PermissionLevel,
  admin:boolean,
): boolean {
  if (admin) {
    return true;
  }
  const allowedRoles = componentPermissions[domain]?.[permission] ?? [];
  return roles.some(role => allowedRoles.includes(role));
}
