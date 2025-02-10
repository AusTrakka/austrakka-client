import { PendingChange } from '../../../src/types/userDetailEdit.interface';
import { groupChangesByType } from '../../../src/utilities/privilegeUtils';

describe('groupChangesByType', () => {
  test('should group changes by type and recordType', () => {
    const changes: PendingChange[] = [
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordName: 'User1',
          recordGlobalId: '1',
          roleName: 'Admin',
        },
      },
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordName: 'User2',
          recordGlobalId: '2',
          roleName: 'Editor',
        },
      },
      {
        type: 'DELETE',
        recordType: 'Role',
        payload: {
          recordName: 'Role1',
          recordGlobalId: '3',
          roleName: 'Viewer',
        },
      },
      {
        type: 'POST',
        recordType: 'Role',
        payload: {
          recordName: 'Role2',
          recordGlobalId: '4',
          roleName: 'Editor',
        },
      },
    ];

    const result = groupChangesByType(changes);

    expect(result).toEqual({
      POST: {
        User: [
          {
            type: 'POST',
            recordType: 'User',
            payload: {
              recordName: 'User1',
              recordGlobalId: '1',
              roleName: 'Admin',
            },
          },
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
        Role: [
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
      },
      DELETE: {
        Role: [
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
      },
    });
  });

  test('should handle empty changes array', () => {
    const changes: PendingChange[] = [];
    const result = groupChangesByType(changes);

    expect(result).toEqual({});
  });

  test('should handle changes with only one type and recordType', () => {
    const changes: PendingChange[] = [
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordName: 'User1',
          recordGlobalId: '1',
          roleName: 'Admin',
        },
      },
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordName: 'User2',
          recordGlobalId: '2',
          roleName: 'Editor',
        },
      },
    ];

    const result = groupChangesByType(changes);

    expect(result).toEqual({
      POST: {
        User: [
          {
            type: 'POST',
            recordType: 'User',
            payload: {
              recordName: 'User1',
              recordGlobalId: '1',
              roleName: 'Admin',
            },
          },
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
      },
    });
  });

  test('should handle changes with multiple types but same recordType', () => {
    const changes: PendingChange[] = [
      {
        type: 'POST',
        recordType: 'User',
        payload: {
          recordName: 'User1',
          recordGlobalId: '1',
          roleName: 'Admin',
        },
      },
      {
        type: 'DELETE',
        recordType: 'User',
        payload: {
          recordName: 'User2',
          recordGlobalId: '2',
          roleName: 'Editor',
        },
      },
    ];

    const result = groupChangesByType(changes);

    expect(result).toEqual({
      POST: {
        User: [
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
      },
      DELETE: {
        User: [
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
      },
    });
  });
});
