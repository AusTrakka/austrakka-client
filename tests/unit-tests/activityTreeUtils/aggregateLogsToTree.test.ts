import { aggregateLogsToTree } from '../../../src/utilities/activityTreeUtils';
import { DerivedLog } from '../../../src/types/dtos';

describe('aggregateLogsToTree', () => {
  it('should aggregate logs into a tree structure by primary and secondary keys', () => {
    const logs: DerivedLog[] = [
      {
        globalId: '1',
        clientSessionId: 'A',
        eventType: 'CREATE',
        callId: 'X',
        submitterGlobalId: 'user1',
        resourceType: 'Sample',
        submitterDisplayName: 'User 1',
        eventStatus: 'SUCCESS',
        eventTime: '2024-01-01T00:00:00Z',
        resourceUniqueString: 'Sample1',
      } as DerivedLog,
      {
        globalId: '2',
        clientSessionId: 'A',
        eventType: 'CREATE',
        callId: 'Y',
        submitterGlobalId: 'user1',
        resourceType: 'Sample',
        submitterDisplayName: 'User 1',
        eventStatus: 'SUCCESS',
        eventTime: '2024-01-01T00:01:00Z',
        resourceUniqueString: 'Sample2',
      } as DerivedLog,
      {
        globalId: '3',
        clientSessionId: 'B',
        eventType: 'UPDATE',
        callId: 'Z',
        submitterGlobalId: 'user2',
        resourceType: 'Project',
        submitterDisplayName: 'User 2',
        eventStatus: 'FAILED',
        eventTime: '2024-01-01T00:02:00Z',
        resourceUniqueString: 'Project1',
      } as DerivedLog,
      {
        globalId: '4',
        clientSessionId: 'C',
        eventType: 'DELETE',
        callId: 'Q',
        submitterGlobalId: 'user3',
        resourceType: 'Sample',
        submitterDisplayName: 'User 3',
        eventStatus: 'SUCCESS',
        eventTime: '2024-01-01T00:03:00Z',
        resourceUniqueString: 'Sample3',
      } as DerivedLog,
      {
        globalId: '5',
        clientSessionId: 'D',
        eventType: 'DELETE',
        callId: 'Q',
        submitterGlobalId: 'user4',
        resourceType: 'Sample',
        submitterDisplayName: 'User 4',
        eventStatus: 'SUCCESS',
        eventTime: '2024-01-01T00:04:00Z',
        resourceUniqueString: 'Sample4',
      } as DerivedLog,
    ];
    const tree = aggregateLogsToTree(logs);
    expect(tree.length).toBeGreaterThan(0);
    // Should group by clientSessionId_eventType and callId_eventType
    expect(tree.some(node => node.key === 'A_CREATE')).toBe(true);
    expect(tree.some(node => node.key === 'B_UPDATE')).toBe(true);
    expect(tree.some(node => node.key === 'Q_DELETE')).toBe(true);
    // Unaggregated log should appear
    expect(tree.some(node => node.children?.some(child => child.key === '3'))).toBe(true);
    // Children should be present
    tree.forEach(node => {
      expect(Array.isArray(node.children)).toBe(true);
      node.children!.forEach(child => {
        expect(child.leaf).toBe(true);
      });
    });
  });
});
