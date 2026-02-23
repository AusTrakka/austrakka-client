import { updatePendingChanges } from '../../../src/utilities/privilegeUtils';
import { PendingChange, RoleAssignments } from '../../../src/types/userDetailEdit.interface';

describe('updatePendingChanges', () => {
  const mockRecordType = 'User';

  const mockFilteredAssignedRoles: RoleAssignments[] = [
    {
      record: { id: '1', name: 'User1', abbrev: 'U1' },
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

  const mockPendingChanges: PendingChange[] = [
    {
      type: 'DELETE',
      recordType: 'User',
      payload: {
        recordGlobalId: '1',
        roleName: 'Admin',
        roleGlobalId: 'role1',
        recordName: 'User1',
      },
    },
  ];

  test('should add POST changes for new roles and remove DELETE changes for existing roles', () => {
    const result = updatePendingChanges(
      mockPendingChanges,
      mockRecordType,
      mockFilteredAssignedRoles,
    );

    expect(result).toEqual([
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordGlobalId: '1',
          roleGlobalId: 'role2',
          recordName: 'User1',
          roleName: 'Editor',
        },
      },
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordGlobalId: '2',
          roleGlobalId: 'role3',
          recordName: 'User2',
          roleName: 'Viewer',
        },
      },
    ]);
  });

  test('should handle empty pendingChanges by adding POST changes for all roles', () => {
    const result = updatePendingChanges(
      [],
      mockRecordType,
      mockFilteredAssignedRoles,
    );

    expect(result).toEqual([
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordGlobalId: '1',
          roleGlobalId: 'role1',
          recordName: 'User1',
          roleName: 'Admin',
        },
      },
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordGlobalId: '1',
          roleGlobalId: 'role2',
          recordName: 'User1',
          roleName: 'Editor',
        },
      },
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordGlobalId: '2',
          roleGlobalId: 'role3',
          recordName: 'User2',
          roleName: 'Viewer',
        },
      },
    ]);
  });

  test('should handle empty filteredAssignedRoles by returning pendingChanges unchanged', () => {
    const result = updatePendingChanges(
      mockPendingChanges,
      mockRecordType,
      [],
    );

    expect(result).toEqual(mockPendingChanges);
  });

  test('should remove DELETE changes if the role is reassigned', () => {
    const result = updatePendingChanges(
      [
        {
          type: 'DELETE',
          recordType: 'User',
          payload: {
            recordGlobalId: '1',
            roleName: 'Admin',
            roleGlobalId: 'role1',
            recordName: 'User1',
          },
        },
      ],
      mockRecordType,
      [
        {
          record: { id: '1', name: 'User1', abbrev: 'U1' },
          roles: [
            { name: 'Admin', globalId: 'role1', allowedRootResourceTypes: [], privilegeLevel: 'Root' },
          ],
        },
      ],
    );

    expect(result).toEqual([]);
  });

  test('should handle mixed POST and DELETE changes correctly', () => {
    const result = updatePendingChanges(
      [
        {
          type: 'DELETE',
          recordType: 'User',
          payload: {
            recordGlobalId: '1',
            roleName: 'Admin',
            roleGlobalId: 'role1',
            recordName: 'User1',
          },
        },
        {
          type: 'POST',
          recordType: 'User',
          payload: {
            recordGlobalId: '2',
            roleGlobalId: 'role3',
            recordName: 'User2',
            roleName: 'Viewer',
          },
        },
      ],
      mockRecordType,
      mockFilteredAssignedRoles,
    );

    expect(result).toEqual([
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordGlobalId: '2',
          recordName: 'User2',
          roleGlobalId: 'role3',
          roleName: 'Viewer',
        },
      },
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordGlobalId: '1',
          roleGlobalId: 'role2',
          recordName: 'User1',
          roleName: 'Editor',
        },
      },
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordGlobalId: '2',
          roleGlobalId: 'role3',
          recordName: 'User2',
          roleName: 'Viewer',
        },
      },
    ]);
  });
});
