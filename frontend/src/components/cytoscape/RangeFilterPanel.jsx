import React, {
  useMemo, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import './RangeFilterPanel.css';

const RangeFilterPanel = ({
  visible, onClose, cytoscapeObject,
}) => {
  const [selectedProp, setSelectedProp] = useState('');
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(100);
  const [currentMin, setCurrentMin] = useState(0);
  const [currentMax, setCurrentMax] = useState(100);
  const [hiddenCount, setHiddenCount] = useState(0);

  const numericProps = useMemo(() => {
    if (!cytoscapeObject || !visible) return [];
    const propSet = {};
    cytoscapeObject.nodes().forEach((n) => {
      const props = n.data('properties') || {};
      Object.entries(props).forEach(([k, v]) => {
        const num = Number(v);
        if (v !== null && v !== '' && !Number.isNaN(num)) {
          if (!propSet[k]) {
            propSet[k] = { min: num, max: num, count: 0 };
          }
          if (num < propSet[k].min) {
            propSet[k].min = num;
          }
          if (num > propSet[k].max) {
            propSet[k].max = num;
          }
          propSet[k].count += 1;
        }
      });
    });
    return Object.entries(propSet)
      .filter(([, v]) => v.count >= 2 && v.min !== v.max)
      .map(([k, v]) => ({
        name: k,
        min: v.min,
        max: v.max,
        count: v.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [cytoscapeObject, visible]);

  const handlePropChange = useCallback((propName) => {
    setSelectedProp(propName);
    if (!propName) {
      if (cytoscapeObject) {
        cytoscapeObject.nodes()
          .style('display', 'element');
        cytoscapeObject.edges()
          .style('display', 'element');
      }
      setHiddenCount(0);
      return;
    }
    const prop = numericProps.find(
      (p) => p.name === propName,
    );
    if (prop) {
      setMinVal(prop.min);
      setMaxVal(prop.max);
      setCurrentMin(prop.min);
      setCurrentMax(prop.max);
      setHiddenCount(0);
    }
  }, [cytoscapeObject, numericProps]);

  const applyRange = useCallback((
    newMin, newMax,
  ) => {
    if (!cytoscapeObject || !selectedProp) return;
    let hidden = 0;

    cytoscapeObject.nodes().forEach((n) => {
      const props = n.data('properties') || {};
      const val = Number(props[selectedProp]);
      if (
        props[selectedProp] !== undefined
        && props[selectedProp] !== null
        && !Number.isNaN(val)
      ) {
        const show = val >= newMin && val <= newMax;
        n.style(
          'display', show ? 'element' : 'none',
        );
        if (!show) hidden += 1;
      }
    });

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

    setHiddenCount(hidden);
  }, [cytoscapeObject, selectedProp]);

  const handleMinChange = useCallback((val) => {
    const v = Number(val);
    setCurrentMin(v);
    applyRange(v, currentMax);
  }, [applyRange, currentMax]);

  const handleMaxChange = useCallback((val) => {
    const v = Number(val);
    setCurrentMax(v);
    applyRange(currentMin, v);
  }, [applyRange, currentMin]);

  const resetFilter = useCallback(() => {
    if (cytoscapeObject) {
      cytoscapeObject.nodes()
        .style('display', 'element');
      cytoscapeObject.edges()
        .style('display', 'element');
    }
    setSelectedProp('');
    setHiddenCount(0);
  }, [cytoscapeObject]);

  if (!visible) return null;

  const step = maxVal - minVal > 100
    ? 1 : (maxVal - minVal) / 100 || 1;

  return (
    <div className="range-filter-panel">
      <div className="range-header">
        <span className="range-header-title">
          <FontAwesomeIcon
            icon={faSlidersH}
            style={{ marginRight: 8 }}
          />
          Range Filter
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="range-body">
        <div className="range-section">
          <span className="range-section-title">
            Numeric Property
          </span>
          <select
            className="range-prop-select"
            value={selectedProp}
            onChange={(e) => handlePropChange(
              e.target.value,
            )}
          >
            <option value="">
              Select a property...
            </option>
            {numericProps.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
                {' '}
                (
                {p.count}
                {' nodes)'}
              </option>
            ))}
          </select>
        </div>

        {selectedProp && (
          <div className="range-section">
            <span className="range-section-title">
              Minimum
            </span>
            <div className="range-slider-wrap">
              <input
                type="range"
                className="range-slider"
                min={minVal}
                max={maxVal}
                step={step}
                value={currentMin}
                onChange={(e) => handleMinChange(
                  e.target.value,
                )}
              />
            </div>
            <div className="range-values">
              <span>{minVal}</span>
              <span>{maxVal}</span>
            </div>
            <div className="range-current">
              {'Min: '}
              {typeof currentMin === 'number'
                ? currentMin.toFixed(1) : currentMin}
            </div>

            <span className="range-section-title">
              Maximum
            </span>
            <div className="range-slider-wrap">
              <input
                type="range"
                className="range-slider"
                min={minVal}
                max={maxVal}
                step={step}
                value={currentMax}
                onChange={(e) => handleMaxChange(
                  e.target.value,
                )}
              />
            </div>
            <div className="range-values">
              <span>{minVal}</span>
              <span>{maxVal}</span>
            </div>
            <div className="range-current">
              {'Max: '}
              {typeof currentMax === 'number'
                ? currentMax.toFixed(1) : currentMax}
            </div>

            {hiddenCount > 0 && (
              <div className="range-filter-info">
                {hiddenCount}
                {' nodes hidden'}
              </div>
            )}

            <button
              type="button"
              className="range-reset-btn"
              onClick={resetFilter}
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

RangeFilterPanel.defaultProps = {
  cytoscapeObject: null,
};

RangeFilterPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
};

export default RangeFilterPanel;
