import { RolesV2 } from './dtos';

export interface PendingChanges {
  type: 'POST' | 'DELETE';
  recordType: string;
  payload: Payload;
}

export interface Payload {
  recordName: string;
  recordGlobalId: string;
  roleName: string;
  roleGlobalId: string;
}

export interface RoleAssignments {
  record: MinifiedRecord;
  roles: RolesV2[];
}

export interface MinifiedRecord {
  id: string;
  name: string;
  abbrev: string;
}
