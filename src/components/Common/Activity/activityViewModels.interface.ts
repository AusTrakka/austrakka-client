export type VisChainEntry = {
  GlobalId: string;
  ResourceType: string;
  UniqueStringId: string;
};

export interface ActivityDetailInfo {
  Event: string;
  GlobalId?: string;
  'Time stamp': string;
  'Event initiated by': string;
  Resource: string;
  'Resource Type': string;
  Context?: VisChainEntry[];
  Details: any;
}
