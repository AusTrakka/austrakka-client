import type { TreeNode } from 'primereact/treenode';
import { processTreeNodes } from '../../../src/utilities/activityTreeUtils';

describe('processTreeNodes', () => {
  it('should flatten nodes with a single child', () => {
    const nodes: TreeNode[] = [
      {
        key: 'parent',
        label: 'Parent',
        data: {},
        children: [{ key: 'child', label: 'Child', data: {}, leaf: true }],
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
          {
            key: 'c1',
            label: 'C1',
            data: { resourceType: 'A', resourceUniqueString: 'R1' },
            leaf: true,
          },
          {
            key: 'c2',
            label: 'C2',
            data: { resourceType: 'B', resourceUniqueString: 'R2' },
            leaf: true,
          },
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
    const nodes: TreeNode[] = [{ key: 'parent', label: 'Parent', data: {}, children: [] }];
    const processed = processTreeNodes(nodes);
    expect(processed[0].leaf).toBe(true);
    expect(processed[0].children).toBeUndefined();
  });
});
