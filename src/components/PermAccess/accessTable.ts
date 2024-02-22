interface Role {
  name: string;
  permissions: Readonly<Record<Domain, Record<string, Record<PermissionLevel, boolean>>>>;
}

enum Domain {
  Tabs = 'Tabs',
  Projects = 'Projects',
  Users = 'Users',
  Components = 'Components',
}

enum PermissionLevel {
  Read = 'read',
  Write = 'write',
  Update = 'update',
  Delete = 'delete',
}

const permissions: Readonly<Record<Domain, Record<string, Record<PermissionLevel, boolean>>>> = {
  Tabs: {
    DatasetTab: {
      [PermissionLevel.Read]: true,
      [PermissionLevel.Write]: false,
      [PermissionLevel.Update]: false,
      [PermissionLevel.Delete]: false,
    },
  },
  Components: {
    DatasetTable: {
      [PermissionLevel.Read]: true,
      [PermissionLevel.Write]: false,
      [PermissionLevel.Update]: false,
      [PermissionLevel.Delete]: false,
    },
    // Add more components and permissions
  },
  Users: {},
  Projects: {},
};

const roles: Readonly<Record<string, Role>> = {
  Viewer: {
    name: 'Viewer',
    permissions: {
      Tabs: permissions.Tabs,
      Components: {
        DatasetTable: permissions.Components.DatasetTable,
      },
      Users: {},
      Projects: {},
    },
  },
  Analyst: {
    name: 'Analyst',
    permissions: {
      Tabs: permissions.Tabs,
      Components: {
        DatasetTable: {
          ...permissions.Components.DatasetTable,
          [PermissionLevel.Write]: true,
          [PermissionLevel.Update]: true,
          [PermissionLevel.Delete]: true,
        },
      },
      Users: {},
      Projects: {},
    },
  },
};

// Example usage to check permissions
export function hasPermission(
  role: string,
  domain: Domain,
  resource: string,
  permission: PermissionLevel,
): boolean {
  // Check if the role exists and has permissions defined for the given domain and resource
  const rolePermissions = roles[role]?.permissions?.[domain]?.[resource];
  return rolePermissions?.[permission] ?? false;
}
