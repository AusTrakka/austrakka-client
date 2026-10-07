export type VisChainEntry = {
  GlobalId: string;
  ResourceType: string;
  UniqueStringId: string;
};

export interface ActivityDetailInfo {
  Status: string;
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
