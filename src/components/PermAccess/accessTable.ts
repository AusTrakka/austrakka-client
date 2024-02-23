interface Role {
  name: string;
  permissions: Readonly<Record<string, Record<PermissionLevel, boolean>>>;
}

export enum PermissionLevel {
  CanClick = 'canClick',
  CanShow = 'canShow',
}

// Define the permissions
const permissions: Readonly<Record<string, Record<PermissionLevel, boolean>>> = {
  'project/tabs/datasettab': {
    [PermissionLevel.CanShow]: true,
    [PermissionLevel.CanClick]: true,
  },
  'project/tabs/datasettab/datasettable': {
    [PermissionLevel.CanShow]: true,
    [PermissionLevel.CanClick]: false,
  },
};

const rolesRules: Readonly<Record<string, Role>> = {
  Viewer: {
    name: 'Viewer',
    permissions,
  },
  Analyst: {
    name: 'ProjectAnalyst',
    permissions: {
      'project/tabs/datasettab': permissions['project/tabs/datasettab'],
      'project/tabs/datasettab/datasettable': {
        ...permissions['project/tabs/datasettab/datasettable'],
        [PermissionLevel.CanClick]: true,
      },
    },
  },
};

export function hasPermission(
  roles: string[],
  domain: string,
  permission: PermissionLevel,
): boolean {
  let allow = false;

  // Loop through each role in the array
  for (const role of roles) {
    // Check if the role exists
    const roleDefinition = rolesRules[role];
    if (roleDefinition) {
      // console.log(`Checking role ${role}`);
      // Check if the role has permissions defined for the given domain
      const domainPermissions = roleDefinition.permissions?.[domain];
      // console.log(`Domain permissions for ${domain}:`, domainPermissions);
      if (domainPermissions && domainPermissions[permission]) {
        // console.log(`Role ${role} has permission ${permission} for domain ${domain}`);
        allow = true;
        break;
      }
    }
  }

  return allow;
}
