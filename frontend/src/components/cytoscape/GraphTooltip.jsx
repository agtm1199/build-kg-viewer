import React from 'react';
import PropTypes from 'prop-types';
import './GraphTooltip.css';

const GraphTooltip = ({ tooltipData }) => {
  if (!tooltipData) return null;
  const {
    data, x, y, connectedEdges,
  } = tooltipData;
  const isEdge = !!data.source;
  const properties = data.properties || {};
  const propEntries = Object.entries(properties).slice(0, 3);

  const style = {
    left: `${Math.max(0, x + 15)}px`,
    top: `${Math.max(0, y - 10)}px`,
  };

  return (
    <div className="graph-tooltip" style={style}>
      <span
        className="graph-tooltip-badge"
        style={{ backgroundColor: data.backgroundColor, color: data.fontColor }}
      >
        {data.label}
      </span>
      {propEntries.map(([key, val]) => (
        <div key={key} className="tooltip-prop">
          <strong>
            {key}
            :
          </strong>
          {' '}
          {typeof val === 'object' ? JSON.stringify(val) : String(val).substring(0, 80)}
        </div>
      ))}
      {!isEdge && connectedEdges > 0 && (
        <div className="tooltip-prop">
          <strong>Edges:</strong>
          {' '}
          {connectedEdges}
        </div>
      )}
    </div>
  );
};

GraphTooltip.defaultProps = {
  tooltipData: null,
};

GraphTooltip.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  tooltipData: PropTypes.any,
};

export default GraphTooltip;
