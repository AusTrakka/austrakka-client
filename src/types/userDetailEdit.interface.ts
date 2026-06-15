import type { Role } from './dtos';

export interface PendingChange {
  type: 'POST' | 'DELETE';
  recordType: string;
  payload: Payload;
}

export interface Payload {
  recordName: string;
  recordGlobalId: string;
  roleName: string;
  roleGlobalId?: string;
  privilegeGlobalId?: string;
}

export interface RoleAssignments {
  record: MinifiedRecord;
  roles: Role[];
}

export interface MinifiedRecord {
  id: string;
  name: string;
  abbrev: string;
}
