export type VisChainEntry = {
  globalId: string;
  resourceType: string;
  uniqueStringId: string;
};

export interface ActivityDetailInfo {
  Event: string;
  GlobalId?: string;
  'Time stamp': string;
  'Event initiated by': string;
  Resource: string;
  'Resource Type': string;
  Context?: VisChainEntry[];
  'Error Message': string;
  Details: any;
}
