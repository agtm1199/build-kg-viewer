import { useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

const COLLAPSE_THRESHOLD = 20;

const NodeGrouping = ({
  enabled,
  cytoscapeObject,
  onGroupCountChange,
}) => {
  const collapsedGroups = useRef(new Set());
  const originalDisplay = useRef(new Map());

  const collapseByLabel = useCallback(() => {
    if (!cytoscapeObject || !enabled) return;

    const nodes = cytoscapeObject.nodes();
    const byLabel = {};
    nodes.forEach((n) => {
      const label = n.data('label') || 'Unknown';
      if (!byLabel[label]) byLabel[label] = [];
      byLabel[label].push(n);
    });

    let groupCount = 0;
    const newCollapsed = new Set();

    Object.entries(byLabel).forEach(
      ([label, labelNodes]) => {
        if (labelNodes.length < COLLAPSE_THRESHOLD) {
          return;
        }

        // Create or find group node
        const groupId = `group_${label}`;
        let groupNode = cytoscapeObject.getElementById(
          groupId,
        );

        if (groupNode.length === 0) {
          // Get representative color
          const rep = labelNodes[0];
          cytoscapeObject.add({
            group: 'nodes',
            data: {
              id: groupId,
              label: `${label} (${labelNodes.length})`,
              backgroundColor:
                rep.data('backgroundColor'),
              borderColor:
                rep.data('borderColor'),
              fontColor:
                rep.data('fontColor'),
              size: Math.min(
                90,
                55 + labelNodes.length * 0.1,
              ),
              properties: {
                type: 'group',
                childLabel: label,
                count: labelNodes.length,
              },
              caption: 'label',
            },
            classes: 'group-node',
          });
          groupNode = cytoscapeObject.getElementById(
            groupId,
          );
        } else {
          groupNode.data(
            'label',
            `${label} (${labelNodes.length})`,
          );
          groupNode.data('properties').count = (
            labelNodes.length
          );
        }

        // Hide individual nodes
        labelNodes.forEach((n) => {
          originalDisplay.current.set(
            n.id(),
            n.style('display'),
          );
          n.style('display', 'none');
          n.connectedEdges().style(
            'display', 'none',
          );
        });

        newCollapsed.add(label);
        groupCount += 1;
      },
    );

    collapsedGroups.current = newCollapsed;
    if (onGroupCountChange) {
      onGroupCountChange(groupCount);
    }
  }, [cytoscapeObject, enabled, onGroupCountChange]);

  const expandGroup = useCallback((label) => {
    if (!cytoscapeObject) return;

    const groupId = `group_${label}`;
    const groupNode = cytoscapeObject.getElementById(
      groupId,
    );
    if (groupNode.length > 0) {
      groupNode.remove();
    }

    // Show individual nodes
    cytoscapeObject.nodes().forEach((n) => {
      if (n.data('label') === label) {
        n.style('display', 'element');
        n.connectedEdges().forEach((e) => {
          const srcVis = e.source()
            .style('display') !== 'none';
          const tgtVis = e.target()
            .style('display') !== 'none';
          if (srcVis && tgtVis) {
            e.style('display', 'element');
          }
        });
      }
    });

    collapsedGroups.current.delete(label);
    if (onGroupCountChange) {
      onGroupCountChange(
        collapsedGroups.current.size,
      );
    }
  }, [cytoscapeObject, onGroupCountChange]);

  const restoreAll = useCallback(() => {
    if (!cytoscapeObject) return;

    // Remove group nodes
    cytoscapeObject.nodes('.group-node').remove();

    // Restore all hidden nodes
    cytoscapeObject.nodes()
      .style('display', 'element');
    cytoscapeObject.edges().forEach((e) => {
      const srcVis = e.source()
        .style('display') !== 'none';
      const tgtVis = e.target()
        .style('display') !== 'none';
      e.style(
        'display',
        srcVis && tgtVis ? 'element' : 'none',
      );
    });

    collapsedGroups.current.clear();
    originalDisplay.current.clear();
    if (onGroupCountChange) {
      onGroupCountChange(0);
    }
  }, [cytoscapeObject, onGroupCountChange]);

  // Apply/remove grouping when enabled changes
  useEffect(() => {
    if (!cytoscapeObject) return undefined;

    if (!enabled) {
      restoreAll();
      return undefined;
    }

    collapseByLabel();

    // Double-click to expand
    const handler = (e) => {
      const ele = e.target;
      if (
        ele.isNode
        && ele.isNode()
        && ele.hasClass('group-node')
      ) {
        const { childLabel } = (
          ele.data('properties') || {}
        );
        if (childLabel) {
          expandGroup(childLabel);
        }
      }
    };
    cytoscapeObject.on('dbltap', 'node', handler);

    return () => {
      cytoscapeObject.off(
        'dbltap', 'node', handler,
      );
    };
  }, [
    enabled,
    cytoscapeObject,
    collapseByLabel,
    expandGroup,
    restoreAll,
  ]);

  return null;
};

NodeGrouping.defaultProps = {
  cytoscapeObject: null,
  onGroupCountChange: null,
};

NodeGrouping.propTypes = {
  enabled: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
  onGroupCountChange: PropTypes.func,
};

export default NodeGrouping;
