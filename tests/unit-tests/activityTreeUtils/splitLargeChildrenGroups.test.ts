import { TreeNode } from 'primereact/treenode';
import { splitLargeChildrenGroups } from '../../../src/utilities/activityTreeUtils';

describe('splitLargeChildrenGroups', () => {
  it('should not split if children are within maxSize', () => {
    const parent: TreeNode = {
      key: 'parent',
      label: 'Parent',
      data: {},
      children: Array.from({ length: 100 }, (_, i) => ({ key: `c${i}`, label: `C${i}`, data: {}, leaf: true })),
    };
    const result = splitLargeChildrenGroups(parent, 500);
    expect(result.length).toBe(1);
    expect(result[0].children!.length).toBe(100);
  });

  it('should split children into chunks if over maxSize', () => {
    const parent: TreeNode = {
      key: 'parent',
      label: 'Parent',
      data: {},
      children: Array.from({ length: 1200 }, (_, i) => ({ key: `c${i}`, label: `C${i}`, data: {}, leaf: true })),
    };
    const result = splitLargeChildrenGroups(parent, 500);
    expect(result.length).toBe(3);
    expect(result[0].children!.length).toBe(500);
    expect(result[1].children!.length).toBe(500);
    expect(result[2].children!.length).toBe(200);
  });
});
