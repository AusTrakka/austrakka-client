import { RoleAssignments } from '../../../src/types/userDetailEdit.interface';
import { updateEditedPrivileges } from '../../../src/utilities/privilegeUtils';
import { GroupedPrivilegesByRecordType } from '../../../src/types/dtos';

describe('updateEditedPrivileges', () => {
  const mockRecordType = 'User';

  const mockFilteredAssignedRoles: RoleAssignments[] = [
    {
      record: { id: '1', name: 'User1', abbrev: 'U1' },
      roles: [
        { name: 'Admin', globalId: 'role1', allowedRootResourceTypes: [], privilegeLevel: 1 },
        {
          name: 'Editor',
          globalId: 'role2',
          allowedRootResourceTypes: [],
          privilegeLevel: 2,
        },
      ],
    },
    {
      record: { id: '2', name: 'User2', abbrev: 'U2' },
      roles: [
        {
          name: 'Viewer',
          globalId: 'role3',
          allowedRootResourceTypes: [],
          privilegeLevel: 3,
        },
      ],
    },
  ];

  const mockExistingPrivileges: GroupedPrivilegesByRecordType[] = [
    {
      recordType: 'User',
      recordRoles: [
        {
          recordName: 'U1',
          recordGlobalId: '1',
          roles: [
            { roleName: 'Admin', privilegeLevel: 1, privilegeGlobalId: undefined },
          ],
        },
      ],
    },
  ];

  test('should update existing privileges with new roles', () => {
    const result = updateEditedPrivileges(
      mockExistingPrivileges,
      mockRecordType,
      mockFilteredAssignedRoles,
    );

    expect(result).toEqual([
      {
        recordType: 'User',
        recordRoles: [
          {
            recordName: 'U1',
            recordGlobalId: '1',
            roles: [
              { roleName: 'Admin', privilegeLevel: 1 },
              { roleName: 'Admin', privilegeLevel: 1 },
              { roleName: 'Editor', privilegeLevel: 2 },
            ],
          },
          {
            recordName: 'U2',
            recordGlobalId: '2',
            roles: [
              { roleName: 'Viewer', privilegeLevel: 3, privilegeGlobalId: undefined },
            ],
          },
        ],
      },
    ]);
  });

  test('should add new privileges if recordType does not exist', () => {
    const result = updateEditedPrivileges(
      [],
      mockRecordType,
      mockFilteredAssignedRoles,
    );

    expect(result).toEqual([
      {
        recordType: 'User',
        recordRoles: [
          {
            recordName: 'U1',
            recordGlobalId: '1',
            roles: [
              { roleName: 'Admin', privilegeLevel: 1, privilegeGlobalId: undefined },
              { roleName: 'Editor', privilegeLevel: 2, privilegeGlobalId: undefined },
            ],
          },
          {
            recordName: 'U2',
            recordGlobalId: '2',
            roles: [
              { roleName: 'Viewer', privilegeLevel: 3, privilegeGlobalId: undefined },
            ],
          },
        ],
      },
    ]);
  });

  test('should handle null prev input by treating it as an empty array', () => {
    const result = updateEditedPrivileges(
      null,
      mockRecordType,
      mockFilteredAssignedRoles,
    );

    expect(result).toEqual([
      {
        recordType: 'User',
        recordRoles: [
          {
            recordName: 'U1',
            recordGlobalId: '1',
            roles: [
              { roleName: 'Admin', privilegeLevel: 1, privilegeGlobalId: undefined },
              { roleName: 'Editor', privilegeLevel: 2, privilegeGlobalId: undefined },
            ],
          },
          {
            recordName: 'U2',
            recordGlobalId: '2',
            roles: [
              { roleName: 'Viewer', privilegeLevel: 3, privilegeGlobalId: undefined },
            ],
          },
        ],
      },
    ]);
  });

  test('should handle empty filteredAssignedRoles by returning prev unchanged', () => {
    const result = updateEditedPrivileges(
      mockExistingPrivileges,
      mockRecordType,
      [],
    );

    expect(result).toEqual(mockExistingPrivileges);
  });
});
