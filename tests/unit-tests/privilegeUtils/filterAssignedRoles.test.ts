import {
  MinifiedRecord,
  PendingChange,
  RoleAssignments,
} from '../../../src/types/userDetailEdit.interface';
import { GroupedPrivilegesByRecordType } from '../../../src/types/dtos';
import { filterAssignedRoles } from '../../../src/utilities/privilegeUtils';

describe('filterAssignedRoles', () => {
  const mockRecordType = 'User';

  const mockAssignedRoles: RoleAssignments[] = [
    {
      record: { id: '1', name: 'User1', abbrev: 'U1' } as MinifiedRecord,
      roles: [
        { name: 'Admin', globalId: 'role1', allowedRootResourceTypes: [], privilegeLevel: 'Root' },
        { name: 'Editor', globalId: 'role2', allowedRootResourceTypes: [], privilegeLevel: 'TrakkaAdmin' },
      ],
    },
    {
      record: { id: '2', name: 'User2', abbrev: 'U2' },
      roles: [
        { name: 'Viewer', globalId: 'role3', allowedRootResourceTypes: [], privilegeLevel: 'Admin' },
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
          roles: [
            { roleName: 'Admin' },
          ],
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
        roleName: 'Viewer',
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
          { name: 'Editor', globalId: 'role2', allowedRootResourceTypes: [], privilegeLevel: 'TrakkaAdmin' },
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
            { name: 'Admin', globalId: 'role1', allowedRootResourceTypes: [], privilegeLevel: 'Root' },
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
    const result = filterAssignedRoles(
      mockRecordType,
      mockAssignedRoles,
      null,
      mockPendingChanges,
    );

    expect(result).toEqual([
      {
        record: { id: '1', name: 'User1', abbrev: 'U1' },
        roles: [
          { name: 'Admin', globalId: 'role1', allowedRootResourceTypes: [], privilegeLevel: 'Root' },
          { name: 'Editor', globalId: 'role2', allowedRootResourceTypes: [], privilegeLevel: 'TrakkaAdmin' },
        ],
      },
    ]);
  });

  test('should handle empty pendingChanges', () => {
    const result = filterAssignedRoles(
      mockRecordType,
      mockAssignedRoles,
      mockEditedPrivileges,
      [],
    );

    expect(result).toEqual([
      {
        record: { id: '1', name: 'User1', abbrev: 'U1' },
        roles: [
          { name: 'Editor', globalId: 'role2', allowedRootResourceTypes: [], privilegeLevel: 'TrakkaAdmin' },
        ],
      },
      {
        record: { id: '2', name: 'User2', abbrev: 'U2' },
        roles: [
          { name: 'Viewer', globalId: 'role3', allowedRootResourceTypes: [], privilegeLevel: 'Admin' },
        ],
      },
    ]);
  });

  test('should handle both editedPrivileges and pendingChanges being empty', () => {
    const result = filterAssignedRoles(
      mockRecordType,
      mockAssignedRoles,
      [],
      [],
    );

    expect(result).toEqual(mockAssignedRoles);
  });
});
