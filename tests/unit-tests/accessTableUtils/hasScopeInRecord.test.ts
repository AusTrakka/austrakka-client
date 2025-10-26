import { GroupedPrivilegesByRecordTypeWithScopes } from '../../../src/types/dtos';
import { hasScopeInRecord } from '../../../src/utilities/accessTableUtils';

describe('hasScopeInRecord', () => {
  describe('when given valid input with expected record and scope', () => {
    test('return true when record has the specified scope', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'tenant-123',
          recordGlobalId: 'record-id-1',
          roles: [{
            roleName: 'User',
            privilegeLevel: 0,
            privilegeGlobalId: 'global-id-1',
            scopes: ['read:users', 'write:users'],
          }],
        }],
      }];

      const result = hasScopeInRecord(groups, 'read:users');
      expect(result).toBe(true);
    });

    test('return true when record has multiple roles and one contains the scope', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'tenant-123',
          recordGlobalId: 'record-id-1',
          roles: [
            {
              roleName: 'Viewer',
              privilegeLevel: 0,
              privilegeGlobalId: 'global-id-1',
              scopes: ['read:basic'],
            },
            {
              roleName: 'Admin',
              privilegeLevel: 0,
              privilegeGlobalId: 'global-id-2',
              scopes: ['read:users', 'write:users'],
            },
          ],
        }],
      }];

      const result = hasScopeInRecord(groups, 'read:users');
      expect(result).toBe(true);
    });

    test('return false when record exists but does not have the specified scope', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'tenant-123',
          recordGlobalId: 'record-id-1',
          roles: [{
            roleName: 'User',
            privilegeLevel: 0,
            privilegeGlobalId: 'global-id-1',
            scopes: ['read:basic'],
          }],
        }],
      }];

      const result = hasScopeInRecord(groups, 'write:users');
      expect(result).toBe(false);
    });
  });

  describe('when given variations of invalid input or values within the input', () => {
    test('return false when recordId is not found in any group', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Organisation',
        recordRoles: [{
          recordName: 'organisation-123',
          recordGlobalId: 'record-id-1',
          roles: [{
            roleName: 'User',
            privilegeLevel: 0,
            privilegeGlobalId: 'global-id-1',
            scopes: ['read:users'],
          }],
        }],
      }];

      const result = hasScopeInRecord(groups, 'read:users', 'non-existent-organisation', 'Organisation');
      expect(result).toBe(false);
    });

    test('return false when groups array is empty', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [];

      const result = hasScopeInRecord(groups, 'read:users', 'organisation-123', 'Organisation');
      expect(result).toBe(false);
    });

    test('return false when roles array is empty', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Organisation',
        recordRoles: [{
          recordName: 'organisation-123',
          recordGlobalId: 'record-id-1',
          roles: [],
        }],
      }];

      const result = hasScopeInRecord(groups, 'read:users', 'organisation-123', 'Organisation');
      expect(result).toBe(false);
    });
  });

  describe('when given two tenant records', () => {
    test('expect only first tenant is considered', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [
          {
            recordName: 'tenant-456',
            recordGlobalId: 'record-id-1',
            roles: [{
              roleName: 'User',
              privilegeLevel: 0,
              privilegeGlobalId: 'global-id-1',
              scopes: ['read:basic'],
            }],
          },
          {
            recordName: 'tenant-123',
            recordGlobalId: 'record-id-2',
            roles: [{
              roleName: 'Admin',
              privilegeLevel: 0,
              privilegeGlobalId: 'global-id-2',
              scopes: ['read:users', 'write:users'],
            }],
          },
        ],
      }];

      const result = hasScopeInRecord(groups, 'write:users');
      expect(result).toBe(false);
    });
  });

  describe('when given edgecase input and usecases', () => {
    test('return true when record exists in a group with multiple recordRoles', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Organisation',
        recordRoles: [
          {
            recordName: 'organisation-456',
            recordGlobalId: 'record-id-1',
            roles: [{
              roleName: 'User',
              privilegeLevel: 0,
              privilegeGlobalId: 'global-id-1',
              scopes: ['read:basic'],
            }],
          },
          {
            recordName: 'organisation-123',
            recordGlobalId: 'record-id-2',
            roles: [{
              roleName: 'Admin',
              privilegeLevel: 0,
              privilegeGlobalId: 'global-id-2',
              scopes: ['read:users', 'write:users'],
            }],
          },
        ],
      }];

      const result = hasScopeInRecord(groups, 'read:users', 'organisation-123', 'Organisation');
      expect(result).toBe(true);
    });

    test('return false when record exists but scopes array is empty', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Organisation',
        recordRoles: [{
          recordName: 'organisation-123',
          recordGlobalId: 'record-id-1',
          roles: [{
            roleName: 'User',
            privilegeLevel: 0,
            privilegeGlobalId: 'global-id-1',
            scopes: [],
          }],
        }],
      }];

      const result = hasScopeInRecord(groups, 'read:users', 'organisation-123', 'Organisation');
      expect(result).toBe(false);
    });
  });
});
