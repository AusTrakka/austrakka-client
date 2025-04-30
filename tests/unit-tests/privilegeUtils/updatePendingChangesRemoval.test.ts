import { updatePendingChangesForRemoval } from '../../../src/utilities/privilegeUtils';
import { RecordRole } from '../../../src/types/dtos';
import { PendingChange } from '../../../src/types/userDetailEdit.interface';

describe('updatePendingChangesForRemoval', () => {
  const mockRecordType = 'User';
  const mockRecordGlobalId = '1';
  const mockRecordName = 'User1';
  const mockRole: RecordRole = {
    roleName: 'Admin',
    privilegeLevel: 1,
    privilegeGlobalId: 'privilege1',
  };

  test('removes POST change if it exists instead of adding DELETE', () => {
    const pendingChanges: PendingChange[] = [
      {
        type: 'POST',
        recordType: mockRecordType,
        payload: {
          recordGlobalId: mockRecordGlobalId,
          recordName: mockRecordName,
          roleName: mockRole.roleName,
          privilegeGlobalId: mockRole.privilegeGlobalId,
        },
      },
    ];

    const result = updatePendingChangesForRemoval(
      pendingChanges,
      mockRecordType,
      mockRecordGlobalId,
      mockRecordName,
      mockRole,
    );

    expect(result).toEqual([]);
  });

  test('adds DELETE change if no POST change exists', () => {
    const pendingChanges: PendingChange[] = [];

    const result = updatePendingChangesForRemoval(
      pendingChanges,
      mockRecordType,
      mockRecordGlobalId,
      mockRecordName,
      mockRole,
    );

    expect(result).toEqual([
      {
        type: 'DELETE',
        recordType: mockRecordType,
        payload: {
          recordGlobalId: mockRecordGlobalId,
          recordName: mockRecordName,
          roleName: mockRole.roleName,
          privilegeGlobalId: mockRole.privilegeGlobalId,
        },
      },
    ]);
  });

  test('does not remove unrelated POST changes', () => {
    const pendingChanges: PendingChange[] = [
      {
        type: 'POST',
        recordType: mockRecordType,
        payload: {
          recordGlobalId: '2',
          recordName: 'User2',
          roleName: 'Editor',
          privilegeGlobalId: 'privilege2',
        },
      },
    ];

    const result = updatePendingChangesForRemoval(
      pendingChanges,
      mockRecordType,
      mockRecordGlobalId,
      mockRecordName,
      mockRole,
    );

    expect(result).toEqual([
      ...pendingChanges,
      {
        type: 'DELETE',
        recordType: mockRecordType,
        payload: {
          recordGlobalId: mockRecordGlobalId,
          recordName: mockRecordName,
          roleName: mockRole.roleName,
          privilegeGlobalId: mockRole.privilegeGlobalId,
        },
      },
    ]);
  });
});
