import { TreeNode } from 'primereact/treenode';
import { defaultNodeSort } from '../../../src/utilities/activityTreeUtils';

describe('defaultNodeSort', () => {
  it('sorts parents by eventTime descending and children by resourceUniqueString ascending', () => {
    const nodes: TreeNode[] = [
      {
        key: '1',
        data: { eventTime: '2024-01-01T10:00:00Z' },
        children: [
          { key: 'a', data: { resourceUniqueString: 'zeta' } },
          { key: 'b', data: { resourceUniqueString: 'alpha' } },
          { key: 'c', data: { resourceUniqueString: 'A10' } },
          { key: 'd', data: { resourceUniqueString: 'A2' } },
        ],
      },
      {
        key: '2',
        data: { eventTime: '2025-01-01T10:00:00Z' },
        children: [
          { key: 'e', data: { resourceUniqueString: 'beta' } },
          { key: 'f', data: { resourceUniqueString: 'gamma' } },
          { key: 'g', data: { resourceUniqueString: 'B1' } },
          { key: 'h', data: { resourceUniqueString: 'B10' } },
        ],
      },
      {
        key: '3',
        data: { eventTime: '2023-12-31T23:59:59Z' },
        children: [
          { key: 'i', data: { resourceUniqueString: '123' } },
          { key: 'j', data: { resourceUniqueString: 'abc' } },
          { key: 'k', data: { resourceUniqueString: 'A1' } },
        ],
      },
      {
        key: '4',
        data: { eventTime: '2026-01-01T00:00:00Z' },
        children: [
          { key: 'l', data: { resourceUniqueString: 'Z9' } },
          { key: 'm', data: { resourceUniqueString: 'Z10' } },
          { key: 'n', data: { resourceUniqueString: 'Z2' } },
        ],
      },
    ];

    const sorted = defaultNodeSort(nodes);

    // Parents sorted by eventTime descending
    expect(sorted[0].key).toBe('4'); // 2026
    expect(sorted[1].key).toBe('2'); // 2025
    expect(sorted[2].key).toBe('1'); // 2024
    expect(sorted[3].key).toBe('3'); // 2023

    // Children sorted by resourceUniqueString ascending (alphanumeric)
    expect(sorted[0].children?.map(c => c.data.resourceUniqueString)).toEqual(['Z2', 'Z9', 'Z10']);
    expect(sorted[1].children?.map(c => c.data.resourceUniqueString)).toEqual(['B1', 'B10', 'beta', 'gamma']);
    expect(sorted[2].children?.map(c => c.data.resourceUniqueString)).toEqual(['A2', 'A10', 'alpha', 'zeta']);
    expect(sorted[3].children?.map(c => c.data.resourceUniqueString)).toEqual(['123', 'A1', 'abc']);
  });
});
