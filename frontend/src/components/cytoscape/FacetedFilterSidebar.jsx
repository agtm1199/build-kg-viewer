import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFilter } from '@fortawesome/free-solid-svg-icons';
import './FacetedFilterSidebar.css';

const FacetedFilterSidebar = ({
  visible, onClose, cytoscapeObject,
}) => {
  const [activeFilters, setActiveFilters] = useState({});

  const facets = useMemo(() => {
    if (!cytoscapeObject || !visible) return null;
    const nodes = cytoscapeObject.nodes();

    // Build facets from node labels
    const labelCounts = {};
    const propFacets = {};

    nodes.forEach((n) => {
      const label = n.data('label') || 'Unknown';
      labelCounts[label] = (labelCounts[label] || 0) + 1;

      const nodeProps = n.data('properties') || {};
      // Track authority facet
      if (nodeProps.authority) {
        if (!propFacets.authority) {
          propFacets.authority = {};
        }
        const auth = nodeProps.authority;
        propFacets.authority[auth] = (
          propFacets.authority[auth] || 0
        ) + 1;
      }
      // Track jurisdiction facet
      if (nodeProps.jurisdiction) {
        if (!propFacets.jurisdiction) {
          propFacets.jurisdiction = {};
        }
        const jur = nodeProps.jurisdiction;
        propFacets.jurisdiction[jur] = (
          propFacets.jurisdiction[jur] || 0
        ) + 1;
      }
    });

    return { labelCounts, propFacets };
  }, [cytoscapeObject, visible]);

  const applyFilters = useCallback((newFilters) => {
    if (!cytoscapeObject) return;
    const filterKeys = Object.keys(newFilters);
    const hasActive = filterKeys.some(
      (k) => newFilters[k] && newFilters[k].length > 0,
    );

    if (!hasActive) {
      // Clear all filters
      cytoscapeObject.nodes().style('display', 'element');
      cytoscapeObject.edges().style('display', 'element');
      return;
    }

    cytoscapeObject.nodes().forEach((n) => {
      const label = n.data('label') || 'Unknown';
      const np = n.data('properties') || {};
      let show = true;

      // Check label filter
      if (
        newFilters.label
        && newFilters.label.length > 0
      ) {
        if (!newFilters.label.includes(label)) {
          show = false;
        }
      }
      // Check authority filter
      if (
        show
        && newFilters.authority
        && newFilters.authority.length > 0
      ) {
        if (!newFilters.authority.includes(
          np.authority,
        )) {
          show = false;
        }
      }
      // Check jurisdiction filter
      if (
        show
        && newFilters.jurisdiction
        && newFilters.jurisdiction.length > 0
      ) {
        if (!newFilters.jurisdiction.includes(
          np.jurisdiction,
        )) {
          show = false;
        }
      }

      n.style('display', show ? 'element' : 'none');
    });

    // Hide edges where either endpoint is hidden
    cytoscapeObject.edges().forEach((e) => {
      const srcVisible = e.source().style('display')
        !== 'none';
      const tgtVisible = e.target().style('display')
        !== 'none';
      e.style(
        'display',
        srcVisible && tgtVisible ? 'element' : 'none',
      );
    });
  }, [cytoscapeObject]);

  const toggleFilter = useCallback((facetKey, value) => {
    setActiveFilters((prev) => {
      const current = prev[facetKey] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = { ...prev, [facetKey]: next };
      applyFilters(updated);
      return updated;
    });
  }, [applyFilters]);

  const clearAll = useCallback(() => {
    setActiveFilters({});
    applyFilters({});
  }, [applyFilters]);

  if (!visible || !facets) return null;

  const activeCount = Object.values(activeFilters)
    .reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);

  const renderFacet = (title, facetKey, items) => {
    const sorted = Object.entries(items)
      .sort(([, a], [, b]) => b - a);
    if (sorted.length === 0) return null;
    return (
      <div className="facet-group" key={facetKey}>
        <h6 className="facet-title">{title}</h6>
        {sorted.map(([val, count]) => {
          const active = (
            activeFilters[facetKey] || []
          ).includes(val);
          return (
            /* eslint-disable jsx-a11y/label-has-associated-control */
            <label
              key={val}
              className={
                `facet-item${active ? ' active' : ''}`
              }
            >
              <input
                type="checkbox"
                checked={active}
                onChange={
                  () => toggleFilter(facetKey, val)
                }
              />
              <span className="facet-item-label">{val}</span>
              <span className="facet-item-count">
                {count}
              </span>
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <div className="faceted-filter-sidebar">
      <div className="facet-header">
        <span className="facet-header-title">
          <FontAwesomeIcon
            icon={faFilter}
            style={{ marginRight: 8 }}
          />
          Filters
          {activeCount > 0 && (
            <span className="facet-active-count">
              {activeCount}
            </span>
          )}
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="facet-body">
        {activeCount > 0 && (
          <button
            type="button"
            className="facet-clear-btn"
            onClick={clearAll}
          >
            Clear all filters
          </button>
        )}
        {renderFacet(
          'Node Type', 'label', facets.labelCounts,
        )}
        {facets.propFacets.authority && renderFacet(
          'Authority', 'authority', facets.propFacets.authority,
        )}
        {facets.propFacets.jurisdiction && renderFacet(
          'Jurisdiction',
          'jurisdiction',
          facets.propFacets.jurisdiction,
        )}
      </div>
    </div>
  );
};

FacetedFilterSidebar.defaultProps = {
  cytoscapeObject: null,
};

FacetedFilterSidebar.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
};

export default FacetedFilterSidebar;
