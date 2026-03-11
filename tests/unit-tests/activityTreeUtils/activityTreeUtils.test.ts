import { TreeNode } from 'primereact/treenode';
import { aggregateLogsToTree, processTreeNodes, splitLargeChildrenGroups } from '../../../src/utilities/activityTreeUtils';
import { DerivedLog } from '../../../src/types/dtos';

describe('activityTreeUtils', () => {
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
          clientSessionId: '',
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
          clientSessionId: '',
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
      // Unaggregated log (missing both keys) should not appear
      expect(tree.some(node => node.children?.some(child => child.key === '3'))).toBe(false);
      // Children should be present
      tree.forEach(node => {
        expect(Array.isArray(node.children)).toBe(true);
        node.children!.forEach(child => {
          expect(child.leaf).toBe(true);
        });
      });
    });
  });

  describe('processTreeNodes', () => {
    it('should flatten nodes with a single child', () => {
      const nodes: TreeNode[] = [
        {
          key: 'parent',
          label: 'Parent',
          data: {},
          children: [
            { key: 'child', label: 'Child', data: {}, leaf: true },
          ],
        },
      ];
      const processed = processTreeNodes(nodes);
      expect(processed.length).toBe(1);
      expect(processed[0].key).toBe('child');
      expect(processed[0].leaf).toBe(true);
    });

    it('should annotate nodes with multiple children', () => {
      const nodes: TreeNode[] = [
        {
          key: 'parent',
          label: 'Parent',
          data: { eventType: 'CREATE' },
          children: [
            { key: 'c1', label: 'C1', data: { resourceType: 'A', resourceUniqueString: 'R1' }, leaf: true },
            { key: 'c2', label: 'C2', data: { resourceType: 'B', resourceUniqueString: 'R2' }, leaf: true },
          ],
        },
      ];
      const processed = processTreeNodes(nodes);
      expect(processed[0].label).toContain('CREATE (2)');
      expect(processed[0].data.resourceCount).toBe(2);
      expect(processed[0].data.resourcePreview).toBe('R1');
      expect(processed[0].data.resourceTypeCount).toBe(2);
      expect(processed[0].data.resourceTypePreview).toBe('A');
    });

    it('should mark nodes with no children as leaf', () => {
      const nodes: TreeNode[] = [
        { key: 'parent', label: 'Parent', data: {}, children: [] },
      ];
      const processed = processTreeNodes(nodes);
      expect(processed[0].leaf).toBe(true);
      expect(processed[0].children).toBeUndefined();
    });
  });

  describe('splitLargeChildrenGroups', () => {
    it('should not split if children are within maxSize', () => {
      const parent: TreeNode = {
        key: 'parent',
        label: 'Parent',
        data: {},
        children: Array.from({ length: 3 }, (_, i) => ({ key: `c${i}`, label: `C${i}`, data: {}, leaf: true })),
      };
      const result = splitLargeChildrenGroups(parent, 5);
      expect(result.length).toBe(1);
      expect(result[0].children!.length).toBe(3);
    });

    it('should split children into chunks if over maxSize', () => {
      const parent: TreeNode = {
        key: 'parent',
        label: 'Parent',
        data: {},
        children: Array.from({ length: 12 }, (_, i) => ({ key: `c${i}`, label: `C${i}`, data: {}, leaf: true })),
      };
      const result = splitLargeChildrenGroups(parent, 5);
      expect(result.length).toBe(3);
      expect(result[0].children!.length).toBe(5);
      expect(result[1].children!.length).toBe(5);
      expect(result[2].children!.length).toBe(2);
      expect(result[0].label).toContain('1-5');
      expect(result[1].label).toContain('6-10');
      expect(result[2].label).toContain('11-12');
    });
  });
});
