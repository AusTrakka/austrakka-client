import type { GroupedPrivilegesByRecordType } from '../../../src/types/dtos';
import type { RoleAssignments } from '../../../src/types/userDetailEdit.interface';
import { updateEditedPrivileges } from '../../../src/utilities/privilegeUtils';

describe('updateEditedPrivileges', () => {
  const mockRecordType = 'User';

  const mockFilteredAssignedRoles: RoleAssignments[] = [
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

  const mockExistingPrivileges: GroupedPrivilegesByRecordType[] = [
    {
      recordType: 'User',
      recordRoles: [
        {
          recordName: 'U1',
          recordGlobalId: '1',
          roles: [{ roleName: 'Admin', privilegeGlobalId: undefined }],
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
              { roleName: 'Admin' },
              { roleName: 'Admin', privilegeLevel: 'Root', privilegeGlobalId: undefined },
              { roleName: 'Editor', privilegeLevel: 'TrakkaAdmin', privilegeGlobalId: undefined },
            ],
          },
          {
            recordName: 'U2',
            recordGlobalId: '2',
            roles: [
              { roleName: 'GroupViewer', privilegeLevel: 'Admin', privilegeGlobalId: undefined },
            ],
          },
        ],
      },
    ]);
  });

  test('should add new privileges if recordType does not exist', () => {
    const result = updateEditedPrivileges([], mockRecordType, mockFilteredAssignedRoles);

    expect(result).toEqual([
      {
        recordType: 'User',
        recordRoles: [
          {
            recordName: 'U1',
            recordGlobalId: '1',
            roles: [
              { roleName: 'Admin', privilegeLevel: 'Root', privilegeGlobalId: undefined },
              { roleName: 'Editor', privilegeLevel: 'TrakkaAdmin', privilegeGlobalId: undefined },
            ],
          },
          {
            recordName: 'U2',
            recordGlobalId: '2',
            roles: [
              { roleName: 'GroupViewer', privilegeLevel: 'Admin', privilegeGlobalId: undefined },
            ],
          },
        ],
      },
    ]);
  });

  test('should handle null prev input by treating it as an empty array', () => {
    const result = updateEditedPrivileges(null, mockRecordType, mockFilteredAssignedRoles);

    expect(result).toEqual([
      {
        recordType: 'User',
        recordRoles: [
          {
            recordName: 'U1',
            recordGlobalId: '1',
            roles: [
              { roleName: 'Admin', privilegeLevel: 'Root', privilegeGlobalId: undefined },
              { roleName: 'Editor', privilegeLevel: 'TrakkaAdmin', privilegeGlobalId: undefined },
            ],
          },
          {
            recordName: 'U2',
            recordGlobalId: '2',
            roles: [
              { roleName: 'GroupViewer', privilegeLevel: 'Admin', privilegeGlobalId: undefined },
            ],
          },
        ],
      },
    ]);
  });

  test('should handle empty filteredAssignedRoles by returning prev unchanged', () => {
    const result = updateEditedPrivileges(mockExistingPrivileges, mockRecordType, []);

    expect(result).toEqual(mockExistingPrivileges);
  });
});
