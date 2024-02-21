interface Role {
  name: string;
  privileges: Privilege[];
}

interface Privilege {
  domain: Domain,
  permissions: Record<string, boolean | Record<string, boolean>>;
}

enum Domain {
  Tabs = 'tabs',
  Projects = 'projects',
  User = 'users',
  Components = 'components',
}

// this might be the wrong way to do this???

const Viewer: Role = {
  name: 'Viewer',
  privileges: [
    {
      domain: Domain.Components,
      permissions: {
        DatasetTable: {
          read: true,
          write: false,
          update: false,
          delete: false,
        },
        // Add more permissions here
      },
    },
    {
      domain: Domain.Tabs,
      permissions: {
        DatasetTab: {
          read: true,
          write: false,
          update: false,
          delete: false,
        },
        // Add more permissions here
      },
    },
  ],
};

const Analyst: Role = {
  name: 'Analyst',
  privileges: [
    {
      domain: Domain.Components,
      permissions: {
        DatasetTable: {
          read: true,
          write: true,
          update: true,
          delete: true,
        },
        // Add more permissions here
      },
      // Add more domains here
    },
    {
      domain: Domain.Tabs,
      permissions: {
        DatasetTab: {
          read: true,
          write: false,
          update: false,
          delete: false,
        },
        // Add more permissions here
      },
    },
  ],
};
