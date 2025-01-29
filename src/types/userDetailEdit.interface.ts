import { RolesV2 } from './dtos';

export interface PendingChanges {
  type: 'POST' | 'DELETE';
  payload: Payload;
}

export interface Payload {
  recordGlobalId: string;
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
