import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import './BreadcrumbNav.css';

const BreadcrumbNav = ({
  trail,
  onNavigate,
  cytoscapeObject,
}) => {
  const handleClick = useCallback((idx) => {
    if (!cytoscapeObject || !trail[idx]) return;
    const crumb = trail[idx];

    if (crumb.type === 'home') {
      // Fit entire graph
      cytoscapeObject.fit(undefined, 30);
    } else if (crumb.elementId) {
      // Center on that element
      const ele = cytoscapeObject.getElementById(
        crumb.elementId,
      );
      if (ele && ele.length > 0) {
        cytoscapeObject.animate({
          center: { eles: ele },
          zoom: crumb.zoom || 1.5,
          duration: 300,
        });
      }
    }

    if (onNavigate) {
      onNavigate(idx);
    }
  }, [cytoscapeObject, trail, onNavigate]);

  if (!trail || trail.length <= 1) return null;

  return (
    <div className="breadcrumb-nav">
      {trail.map((crumb, idx) => {
        const isLast = idx === trail.length - 1;
        return (
          <React.Fragment key={crumb.key || crumb.label}>
            <button
              type="button"
              className={
                `breadcrumb-item${
                  isLast ? ' current' : ''}`
              }
              onClick={
                !isLast
                  ? () => handleClick(idx) : undefined
              }
            >
              {idx === 0 && (
                <FontAwesomeIcon icon={faHome} />
              )}
              {crumb.label}
            </button>
            {!isLast && (
              <span className="breadcrumb-sep">
                <FontAwesomeIcon
                  icon={faChevronRight}
                />
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

BreadcrumbNav.defaultProps = {
  cytoscapeObject: null,
  onNavigate: null,
};

BreadcrumbNav.propTypes = {
  trail: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
      elementId: PropTypes.string,
      zoom: PropTypes.number,
      key: PropTypes.string,
    }),
  ).isRequired,
  onNavigate: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
};

export default BreadcrumbNav;
