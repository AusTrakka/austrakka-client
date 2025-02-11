import { PendingChange } from '../../../src/types/userDetailEdit.interface';
import { groupFailedChangesByType } from '../../../src/utilities/privilegeUtils';

describe('groupFailedChangesByType', () => {
  test('should group failed changes by type and recordType', () => {
    const changes: [string, PendingChange][] = [
      [
        'Failed to add User1 as Admin',
        {
          type: 'POST',
          recordType: 'User',
          payload: {
            recordName: 'User1',
            recordGlobalId: '1',
            roleName: 'Admin',
          },
        },
      ],
      [
        'Failed to add User2 as Editor',
        {
          type: 'POST',
          recordType: 'User',
          payload: {
            recordName: 'User2',
            recordGlobalId: '2',
            roleName: 'Editor',
          },
        },
      ],
      [
        'Failed to remove Role1 as Viewer',
        {
          type: 'DELETE',
          recordType: 'Role',
          payload: {
            recordName: 'Role1',
            recordGlobalId: '3',
            roleName: 'Viewer',
          },
        },
      ],
      [
        'Failed to add Role2 as Editor',
        {
          type: 'POST',
          recordType: 'Role',
          payload: {
            recordName: 'Role2',
            recordGlobalId: '4',
            roleName: 'Editor',
          },
        },
      ],
    ];

    const result = groupFailedChangesByType(changes);

    expect(result).toEqual({
      POST: {
        User: [
          [
            'Failed to add User1 as Admin',
            {
              type: 'POST',
              recordType: 'User',
              payload: {
                recordName: 'User1',
                recordGlobalId: '1',
                roleName: 'Admin',
              },
            },
          ],
          [
            'Failed to add User2 as Editor',
            {
              type: 'POST',
              recordType: 'User',
              payload: {
                recordName: 'User2',
                recordGlobalId: '2',
                roleName: 'Editor',
              },
            },
          ],
        ],
        Role: [
          [
            'Failed to add Role2 as Editor',
            {
              type: 'POST',
              recordType: 'Role',
              payload: {
                recordName: 'Role2',
                recordGlobalId: '4',
                roleName: 'Editor',
              },
            },
          ],
        ],
      },
      DELETE: {
        Role: [
          [
            'Failed to remove Role1 as Viewer',
            {
              type: 'DELETE',
              recordType: 'Role',
              payload: {
                recordName: 'Role1',
                recordGlobalId: '3',
                roleName: 'Viewer',
              },
            },
          ],
        ],
      },
    });
  });

  test('should handle empty failed changes array', () => {
    const changes: [string, PendingChange][] = [];
    const result = groupFailedChangesByType(changes);

    expect(result).toEqual({});
  });

  test('should handle failed changes with only one type and recordType', () => {
    const changes: [string, PendingChange][] = [
      [
        'Failed to add User1 as Admin',
        {
          type: 'POST',
          recordType: 'User',
          payload: {
            recordName: 'User1',
            recordGlobalId: '1',
            roleName: 'Admin',
          },
        },
      ],
      [
        'Failed to add User2 as Editor',
        {
          type: 'POST',
          recordType: 'User',
          payload: {
            recordName: 'User2',
            recordGlobalId: '2',
            roleName: 'Editor',
          },
        },
      ],
    ];

    const result = groupFailedChangesByType(changes);

    expect(result).toEqual({
      POST: {
        User: [
          [
            'Failed to add User1 as Admin',
            {
              type: 'POST',
              recordType: 'User',
              payload: {
                recordName: 'User1',
                recordGlobalId: '1',
                roleName: 'Admin',
              },
            },
          ],
          [
            'Failed to add User2 as Editor',
            {
              type: 'POST',
              recordType: 'User',
              payload: {
                recordName: 'User2',
                recordGlobalId: '2',
                roleName: 'Editor',
              },
            },
          ],
        ],
      },
    });
  });

  test('should handle failed changes with multiple types but same recordType', () => {
    const changes: [string, PendingChange][] = [
      [
        'Failed to add User1 as Admin',
        {
          type: 'POST',
          recordType: 'User',
          payload: {
            recordName: 'User1',
            recordGlobalId: '1',
            roleName: 'Admin',
          },
        },
      ],
      [
        'Failed to remove User2 as Editor',
        {
          type: 'DELETE',
          recordType: 'User',
          payload: {
            recordName: 'User2',
            recordGlobalId: '2',
            roleName: 'Editor',
          },
        },
      ],
    ];

    const result = groupFailedChangesByType(changes);

    expect(result).toEqual({
      POST: {
        User: [
          [
            'Failed to add User1 as Admin',
            {
              type: 'POST',
              recordType: 'User',
              payload: {
                recordName: 'User1',
                recordGlobalId: '1',
                roleName: 'Admin',
              },
            },
          ],
        ],
      },
      DELETE: {
        User: [
          [
            'Failed to remove User2 as Editor',
            {
              type: 'DELETE',
              recordType: 'User',
              payload: {
                recordName: 'User2',
                recordGlobalId: '2',
                roleName: 'Editor',
              },
            },
          ],
        ],
      },
    });
  });
});
