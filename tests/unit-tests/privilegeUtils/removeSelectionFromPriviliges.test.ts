import { GroupedPrivilegesByRecordType, RecordRole } from '../../../src/types/dtos';
import { removeSelectionFromPrivileges } from '../../../src/utilities/privilegeUtils';

describe('removeSelectionFromPrivileges', () => {
  const mockRecordType = 'User';
  const mockRecordName = 'User1';
  const mockRole: RecordRole = { roleName: 'Admin' };

  const mockPrev: GroupedPrivilegesByRecordType[] = [
    {
      recordType: 'User',
      recordRoles: [
        {
          recordName: 'User1',
          recordGlobalId: '1',
          roles: [
            { roleName: 'Admin', privilegeGlobalId: undefined },
            { roleName: 'Editor', privilegeGlobalId: undefined },
          ],
        },
        {
          recordName: 'User2',
          recordGlobalId: '2',
          roles: [
            { roleName: 'Viewer', privilegeGlobalId: undefined },
          ],
        },
      ],
    },
    {
      recordType: 'Role',
      recordRoles: [
        {
          recordName: 'Role1',
          recordGlobalId: '3',
          roles: [
            { roleName: 'Manager', privilegeGlobalId: undefined },
          ],
        },
      ],
    },
  ];

  test('should remove the specified role from the correct record', () => {
    const result = removeSelectionFromPrivileges(
      mockPrev,
      mockRecordType,
      mockRecordName,
      mockRole,
    );

    expect(result).toEqual([
      {
        recordType: 'User',
        recordRoles: [
          {
            recordName: 'User1',
            recordGlobalId: '1',
            roles: [
              { roleName: 'Editor', privilegeGlobalId: undefined },
            ],
          },
          {
            recordName: 'User2',
            recordGlobalId: '2',
            roles: [
              { roleName: 'Viewer', privilegeGlobalId: undefined },
            ],
          },
        ],
      },
      {
        recordType: 'Role',
        recordRoles: [
          {
            recordName: 'Role1',
            recordGlobalId: '3',
            roles: [
              { roleName: 'Manager', privilegeGlobalId: undefined },
            ],
          },
        ],
      },
    ]);
  });

  test('should handle null prev input by returning an empty array', () => {
    const result = removeSelectionFromPrivileges(
      null,
      mockRecordType,
      mockRecordName,
      mockRole,
    );

    expect(result).toEqual([]);
  });

  test('should return unchanged privileges if recordType does not exist', () => {
    const result = removeSelectionFromPrivileges(
      mockPrev,
      'NonExistentType',
      mockRecordName,
      mockRole,
    );

    expect(result).toEqual(mockPrev);
  });

  test('should return unchanged privileges if recordName does not exist', () => {
    const result = removeSelectionFromPrivileges(
      mockPrev,
      mockRecordType,
      'NonExistentName',
      mockRole,
    );

    expect(result).toEqual(mockPrev);
  });

  test('should return unchanged privileges if role does not exist', () => {
    const result = removeSelectionFromPrivileges(
      mockPrev,
      mockRecordType,
      mockRecordName,
      { roleName: 'NonExistentRole' },
    );

    expect(result).toEqual(mockPrev);
  });

  test('should remove the entire record if no roles are left after removal', () => {
    const result = removeSelectionFromPrivileges(
      [
        {
          recordType: 'User',
          recordRoles: [
            {
              recordName: 'User1',
              recordGlobalId: '1',
              roles: [
                { roleName: 'Admin', privilegeGlobalId: undefined },
              ],
            },
          ],
        },
      ],
      mockRecordType,
      mockRecordName,
      mockRole,
    );

    expect(result).toEqual([]);
  });

  test('should handle multiple records and roles correctly', () => {
    const result = removeSelectionFromPrivileges(
      [
        {
          recordType: 'User',
          recordRoles: [
            {
              recordName: 'User1',
              recordGlobalId: '1',
              roles: [
                { roleName: 'Admin', privilegeGlobalId: undefined },
                { roleName: 'Editor', privilegeGlobalId: undefined },
              ],
            },
            {
              recordName: 'User2',
              recordGlobalId: '2',
              roles: [
                { roleName: 'Viewer', privilegeGlobalId: undefined },
              ],
            },
          ],
        },
      ],
      mockRecordType,
      mockRecordName,
      mockRole,
    );

    expect(result).toEqual([
      {
        recordType: 'User',
        recordRoles: [
          {
            recordName: 'User1',
            recordGlobalId: '1',
            roles: [
              { roleName: 'Editor', privilegeGlobalId: undefined },
            ],
          },
          {
            recordName: 'User2',
            recordGlobalId: '2',
            roles: [
              { roleName: 'Viewer', privilegeGlobalId: undefined },
            ],
          },
        ],
      },
    ]);
  });
});
