import { TreeNode } from 'primereact/treenode';
import { DerivedLog } from '../types/dtos';

// Aggregates logs into a tree structure
export function aggregateLogsToTree(logs: DerivedLog[]): TreeNode[] {
  const usedLogIds = new Set<string>();
  const groups = new Map<string, TreeNode>();

  const buildPrimaryKey = (log: DerivedLog) => {
    if (!log.clientSessionId || !log.eventType) return null;
    return `${log.clientSessionId}_${log.eventType}`;
  };

  const buildSecondaryKey = (log: DerivedLog) => {
    if (!log.callId || !log.eventType) return null;
    return `${log.callId}_${log.eventType}`;
  };

  const aggregateByKey = (
    logsToAggregate: DerivedLog[],
    buildKey: (log: DerivedLog) => string | null,
    keyType: 'primary' | 'secondary',
  ) => {
    for (const log of logsToAggregate) {
      if (usedLogIds.has(log.globalId)) continue;

      const groupKey = buildKey(log);
      if (!groupKey) continue;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          label: log.eventType,
          data: {
            eventType: log.eventType,
            submitterGlobalId: log.submitterGlobalId,
            resourceType: log.resourceType,
            submitterDisplayName: log.submitterDisplayName,
            eventStatus: log.eventStatus,
            eventTime: log.eventTime,
            resourceCount: 0,
            resourcePreview: null,
            resourceTypeCount: 0,
            resourceTypePreview: null,
          },
          children: [],
        });
      }

      const parent = groups.get(groupKey)!;

      parent.children!.push({
        key: log.globalId,
        label: log.resourceUniqueString,
        data: { ...log, parentKey: parent.key },
        leaf: true,
      });

      if (keyType === 'secondary') {
        // If secondary filter, always mark log as used to avoid duplicates
        usedLogIds.add(log.globalId);
      }
    }
  };

  aggregateByKey(logs, buildPrimaryKey, 'primary');

  // After primary aggregation, mark logs in multi-child groups as used
  // and remove groups that only have a single child for secondary aggregation
  for (const [groupKey, parent] of groups) {
    const children = parent.children ?? [];
    if (children.length > 1) {
      for (const child of children) {
        // child.key is the globalId assigned when the child node was created
        usedLogIds.add(child.key as string);
      }
    } else if (children.length === 1) {
      groups.delete(groupKey);
    }
  }

  aggregateByKey(logs, buildSecondaryKey, 'secondary');

  return Array.from(groups.values());
}

// Builds information to annotate the table, including counts and previews
export function processTreeNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(node => {
    const children = node.children ?? [];
    const childCount = children.length;

    if (childCount === 1) {
      return { ...children[0] };
    }
    if (childCount > 1) {
      const firstChild = children[0].data as DerivedLog;
      const uniqueResourceTypes = Array.from(
        new Set(children.map(child => (child.data as DerivedLog).resourceType)),
      );

      return {
        ...node,
        label: `${node.data.eventType} (${childCount})`,
        data: {
          ...node.data,
          resourceCount: childCount,
          resourcePreview: firstChild.resourceUniqueString,
          resourceTypeCount: uniqueResourceTypes.length,
          resourceTypePreview: uniqueResourceTypes[0],
        },
        children: children.map(child => ({ ...child, data: { ...child.data } })),
      };
    }

    return { ...node, children: undefined, leaf: true };
  });
}

// Splits nodes with large numbers of children into smaller groups to improve performance
export function splitLargeChildrenGroups(parent: TreeNode, maxSize = 500): TreeNode[] {
  const children = parent.children ?? [];
  if (children.length <= maxSize) return [parent];

  const chunks: TreeNode[] = [];
  for (let i = 0; i < children.length; i += maxSize) {
    const chunkChildren = children.slice(i, i + maxSize);

    // Recompute resourcePreview and resourceTypePreview for the chunk
    const firstChild = chunkChildren[0]?.data;
    const uniqueResourceTypes = Array.from(
      new Set(chunkChildren.map(child => child.data?.resourceType)),
    );
    chunks.push({
      key: `${parent.key}_${i / maxSize}`,
      label: `${parent.label} (${i + 1}-${i + chunkChildren.length})`,
      data: {
        ...parent.data,
        resourceCount: chunkChildren.length,
        resourcePreview: firstChild?.resourceUniqueString,
        resourceTypeCount: uniqueResourceTypes.length,
        resourceTypePreview: uniqueResourceTypes[0],
      },
      children: chunkChildren,
    });
  }
  return chunks;
}
