import type { GroupedPrivilegesByRecordType } from '../../../src/types/dtos';
import type {
  MinifiedRecord,
  PendingChange,
  RoleAssignments,
} from '../../../src/types/userDetailEdit.interface';
import { filterAssignedRoles } from '../../../src/utilities/privilegeUtils';

describe('filterAssignedRoles', () => {
  const mockRecordType = 'User';

  const mockAssignedRoles: RoleAssignments[] = [
    {
      record: { id: '1', name: 'User1', abbrev: 'U1' } as MinifiedRecord,
      roles: [
        {
          name: 'Admin',
          globalId: 'role1',
          resourceTypes: [],
          privilegeLevel: 'Root',
          roleId: 1,
          description: '',
          scopes: [],
        },
        {
          name: 'Editor',
          globalId: 'role2',
          resourceTypes: [],
          privilegeLevel: 'TrakkaAdmin',
          roleId: 2,
          description: '',
          scopes: [],
        },
      ],
    },
    {
      record: { id: '2', name: 'User2', abbrev: 'U2' },
      roles: [
        {
          name: 'GroupViewer',
          globalId: 'role3',
          resourceTypes: [],
          privilegeLevel: 'Admin',
          roleId: 1,
          description: '',
          scopes: [],
        },
      ],
    },
  ];

  const mockEditedPrivileges: GroupedPrivilegesByRecordType[] = [
    {
      recordType: 'User',
      recordRoles: [
        {
          recordName: 'User1',
          recordGlobalId: '1',
          roles: [{ roleName: 'Admin' }],
        },
      ],
    },
  ];

  const mockPendingChanges: PendingChange[] = [
    {
      type: 'POST',
      recordType: 'User',
      payload: {
        recordName: 'User2',
        recordGlobalId: '2',
        roleName: 'GroupViewer',
        roleGlobalId: 'role3',
      },
    },
  ];

  test('should filter out roles that exist in editedPrivileges or pendingChanges', () => {
    const result = filterAssignedRoles(
      mockRecordType,
      mockAssignedRoles,
      mockEditedPrivileges,
      mockPendingChanges,
    );

    expect(result).toEqual([
      {
        record: { id: '1', name: 'User1', abbrev: 'U1' },
        roles: [
          {
            name: 'Editor',
            globalId: 'role2',
            resourceTypes: [],
            privilegeLevel: 'TrakkaAdmin',
            description: '',
            roleId: 2,
            scopes: [],
          },
        ],
      },
    ]);
  });

  test('should return empty array if all roles are filtered out', () => {
    const result = filterAssignedRoles(
      mockRecordType,
      [
        {
          record: { id: '1', name: 'User1', abbrev: 'U1' },
          roles: [
            {
              name: 'Admin',
              globalId: 'role1',
              resourceTypes: [],
              privilegeLevel: 'Root',
              roleId: 1,
              description: '',
              scopes: [],
            },
          ],
        },
      ],
      mockEditedPrivileges,
      [],
    );

    expect(result).toEqual([]);
  });

  test('should handle empty assignedRoles', () => {
    const result = filterAssignedRoles(
      mockRecordType,
      [],
      mockEditedPrivileges,
      mockPendingChanges,
    );

    expect(result).toEqual([]);
  });

  test('should handle null editedPrivileges', () => {
    const result = filterAssignedRoles(mockRecordType, mockAssignedRoles, null, mockPendingChanges);

    expect(result).toEqual([
      {
        record: { id: '1', name: 'User1', abbrev: 'U1' },
        roles: [
          {
            name: 'Admin',
            globalId: 'role1',
            resourceTypes: [],
            privilegeLevel: 'Root',
            description: '',
            roleId: 1,
            scopes: [],
          },
          {
            name: 'Editor',
            globalId: 'role2',
            resourceTypes: [],
            privilegeLevel: 'TrakkaAdmin',
            description: '',
            roleId: 2,
            scopes: [],
          },
        ],
      },
    ]);
  });

  test('should handle empty pendingChanges', () => {
    const result = filterAssignedRoles(mockRecordType, mockAssignedRoles, mockEditedPrivileges, []);

    expect(result).toEqual([
      {
        record: { id: '1', name: 'User1', abbrev: 'U1' },
        roles: [
          {
            name: 'Editor',
            globalId: 'role2',
            resourceTypes: [],
            privilegeLevel: 'TrakkaAdmin',
            description: '',
            roleId: 2,
            scopes: [],
          },
        ],
      },
      {
        record: { id: '2', name: 'User2', abbrev: 'U2' },
        roles: [
          {
            name: 'GroupViewer',
            globalId: 'role3',
            resourceTypes: [],
            privilegeLevel: 'Admin',
            description: '',
            roleId: 1,
            scopes: [],
          },
        ],
      },
    ]);
  });

  test('should handle both editedPrivileges and pendingChanges being empty', () => {
    const result = filterAssignedRoles(mockRecordType, mockAssignedRoles, [], []);

    expect(result).toEqual(mockAssignedRoles);
  });
});
