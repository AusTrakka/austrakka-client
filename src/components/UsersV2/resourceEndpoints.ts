import { ResponseObject } from '../../types/responseObject.interface';
import { getUserListV2, getUserV2, patchUserV2 } from '../../utilities/resourceUtils';

interface ResourceFunctions {
  get: (...args: any[]) => Promise<ResponseObject>;
  list : (...args: any[]) => Promise<ResponseObject>;
  patch: (...args: any[]) => Promise<ResponseObject>;
}

interface Resource {
  name: string;
  functions: ResourceFunctions;
}

export const resourceMap: Resource[] = [
  {
    name: 'User',
    functions: {
      get: getUserV2,
      list: getUserListV2,
      patch: patchUserV2,
    },
  },
  {
    name: 'ProFroma',
    functions: {
      get: () => { throw new Error('ProForm not implemented'); },
      list: () => { throw new Error('ProForm not implemented'); },
      patch: () => { throw new Error('ProForm not implemented'); },
    },
  },
  {
    name: 'Project',
    functions: {
      get: () => { throw new Error('Project not implemented'); },
      list: () => { throw new Error('Project not implemented'); },
      patch: () => { throw new Error('Project not implemented'); },
    },
  },
  {
    name: 'Organisation',
    functions: {
      get: () => { throw new Error('Group not implemented'); },
      list: () => { throw new Error('Group not implemented'); },
      patch: () => { throw new Error('Group not implemented'); },
    },
  },
  {
    name: 'Tenant',
    functions: {
      get: () => { throw new Error('This already exists in the system'); },
      list: () => { throw new Error('Tenant doesnt have a list'); },
      patch: () => { throw new Error('Tenant not implemented'); },
    },
  },
];
