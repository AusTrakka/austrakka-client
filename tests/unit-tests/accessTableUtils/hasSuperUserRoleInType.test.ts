import { GroupedPrivilegesByRecordTypeWithScopes } from '../../../src/types/dtos';
import { hasSuperUserRoleInType } from '../../../src/utilities/accessTableUtils';

describe('hasSuperUserRoleInType', () => {
  describe('when given valid input with expected role types', () => {
    test('return true when user has all scope access', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'SomeTenant',
          recordGlobalId: 'record-global-id-1',
          roles: [{
            roleName: 'SuperUser',
            privilegeLevel: '',
            privilegeGlobalId: 'global-id-1',
            scopes: ['method=*,/**'],
          }],
        }],
      }];

      expect(hasSuperUserRoleInType(groups)).toBe(true);
    });

    test('return true when user has method=*,/** scope', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'SomeTenant',
          recordGlobalId: 'record-global-id-1',
          roles: [{
            roleName: 'RegularUser',
            privilegeLevel: 'User',
            privilegeGlobalId: 'global-id-1',
            scopes: ['method=*,/**'],
          }],
        }],
      }];

      expect(hasSuperUserRoleInType(groups)).toBe(true);
    });

    test('return false when user has neither SuperUser role nor special scope', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'SomeTenant',
          recordGlobalId: 'record-global-id-1',
          roles: [{
            roleName: 'RegularUser',
            privilegeLevel: 'User',
            privilegeGlobalId: 'global-id-1',
            scopes: ['some-other-scope'],
          }],
        }],
      }];

      expect(hasSuperUserRoleInType(groups)).toBe(false);
    });
  });

  describe('when given variations of invalid input or values within the input', () => {
    test('return false when Tenant recordType is not found', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'NotTenant',
        recordRoles: [{
          recordName: 'SomeTenant',
          recordGlobalId: 'record-global-id-1',
          roles: [{
            roleName: 'SuperUser',
            privilegeLevel: '',
            privilegeGlobalId: 'global-id-1',
            scopes: [],
          }],
        }],
      }];

      expect(hasSuperUserRoleInType(groups)).toBe(false);
    });

    test('return false when roles array is empty', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'SomeTenant',
          recordGlobalId: 'record-global-id-1',
          roles: [],
        }],
      }];

      expect(hasSuperUserRoleInType(groups)).toBe(false);
    });

    test('return false when roles is undefined', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'SomeTenant',
          recordGlobalId: 'record-global-id-1',
          roles: undefined!,
        }],
      }];

      expect(hasSuperUserRoleInType(groups)).toBe(false);
    });
  });

  describe('when given edge-case input and use-cases', () => {
    test('handle multiple recordRoles with one having SuperUser', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [
          {
            recordName: 'Tenant1',
            recordGlobalId: 'record-global-id-1',
            roles: [{
              roleName: 'RegularUser',
              privilegeLevel: 'User',
              privilegeGlobalId: 'global-id-1',
              scopes: ['some-scope'],
            }],
          },
          {
            recordName: 'Tenant2',
            recordGlobalId: 'record-global-id-2',
            roles: [{
              roleName: 'SuperUser',
              privilegeLevel: '',
              privilegeGlobalId: 'global-id-2',
              scopes: ['method=*,/**'],
            }],
          },
        ],
      }];

      expect(hasSuperUserRoleInType(groups)).toBe(true);
    });

    test('handle empty groups array', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [];

      expect(hasSuperUserRoleInType(groups)).toBe(false);
    });

    test('handle empty recordRoles array', () => {
      const groups: GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [],
      }];

      expect(hasSuperUserRoleInType(groups)).toBe(false);
    });
  });
});
