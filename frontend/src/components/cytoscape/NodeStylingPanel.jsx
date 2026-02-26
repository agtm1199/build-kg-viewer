import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPalette } from '@fortawesome/free-solid-svg-icons';
import './NodeStylingPanel.css';

const COLOR_PRESETS = [
  { label: 'Default', value: null },
  {
    label: 'By Authority',
    value: 'authority',
    colors: {
      CFIA: '#FEBC9A',
      HC: '#498EDA',
      AAFC: '#8DCC93',
      TC: '#DA7194',
      ECCC: '#ECB5C9',
      UNKNOWN: '#C990C0',
    },
  },
  {
    label: 'By Jurisdiction',
    value: 'jurisdiction',
    colors: {
      CA: '#498EDA',
      QC: '#FEBC9A',
      ON: '#8DCC93',
    },
  },
];

const SIZE_PRESETS = [
  { label: 'Default (uniform)', value: null },
  { label: 'By degree (connections)', value: 'degree' },
];

const NodeStylingPanel = ({
  visible, onClose, cytoscapeObject,
}) => {
  const [colorRule, setColorRule] = useState(null);
  const [sizeRule, setSizeRule] = useState(null);

  const originalStyles = useMemo(() => {
    if (!cytoscapeObject) return {};
    const saved = {};
    cytoscapeObject.nodes().forEach((n) => {
      saved[n.id()] = {
        bg: n.data('backgroundColor'),
        size: n.data('size'),
      };
    });
    return saved;
  }, [cytoscapeObject]);

  const applyColorRule = useCallback((rule) => {
    if (!cytoscapeObject) return;
    setColorRule(rule);

    if (!rule) {
      // Reset to original
      cytoscapeObject.nodes().forEach((n) => {
        const orig = originalStyles[n.id()];
        if (orig) n.data('backgroundColor', orig.bg);
      });
      return;
    }

    const preset = COLOR_PRESETS.find(
      (p) => p.value === rule,
    );
    if (!preset || !preset.colors) return;

    cytoscapeObject.nodes().forEach((n) => {
      const propVal = (n.data('properties') || {})[rule];
      const color = preset.colors[propVal]
        || preset.colors.UNKNOWN || '#C990C0';
      n.data('backgroundColor', color);
    });
  }, [cytoscapeObject, originalStyles]);

  const applySizeRule = useCallback((rule) => {
    if (!cytoscapeObject) return;
    setSizeRule(rule);

    if (!rule) {
      cytoscapeObject.nodes().forEach((n) => {
        const orig = originalStyles[n.id()];
        if (orig) n.data('size', orig.size);
      });
      return;
    }

    if (rule === 'degree') {
      const maxDeg = Math.max(
        ...cytoscapeObject.nodes().map((n) => n.degree()),
        1,
      );
      cytoscapeObject.nodes().forEach((n) => {
        const deg = n.degree();
        const size = 30 + (deg / maxDeg) * 60;
        n.data('size', Math.round(size));
      });
    }
  }, [cytoscapeObject, originalStyles]);

  if (!visible) return null;

  return (
    <div className="styling-panel">
      <div className="styling-header">
        <span className="styling-title">
          <FontAwesomeIcon
            icon={faPalette}
            style={{ marginRight: 8 }}
          />
          Node Styling
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="styling-body">
        <div className="styling-section">
          <h6 className="styling-section-title">
            Color Rule
          </h6>
          {COLOR_PRESETS.map((preset) => (
            /* eslint-disable-next-line jsx-a11y/label-has-associated-control */
            <label
              key={preset.label}
              className={
                `styling-option${
                  colorRule === preset.value
                    ? ' active' : ''}`
              }
            >
              <input
                type="radio"
                name="colorRule"
                checked={colorRule === preset.value}
                onChange={
                  () => applyColorRule(preset.value)
                }
              />
              <span>{preset.label}</span>
              {preset.colors && (
                <span className="styling-swatches">
                  {Object.values(preset.colors)
                    .slice(0, 4)
                    .map((c) => (
                      <span
                        key={c}
                        className="styling-swatch"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                </span>
              )}
            </label>
          ))}
        </div>
        <div className="styling-section">
          <h6 className="styling-section-title">
            Size Rule
          </h6>
          {SIZE_PRESETS.map((preset) => (
            /* eslint-disable-next-line jsx-a11y/label-has-associated-control */
            <label
              key={preset.label}
              className={
                `styling-option${
                  sizeRule === preset.value
                    ? ' active' : ''}`
              }
            >
              <input
                type="radio"
                name="sizeRule"
                checked={sizeRule === preset.value}
                onChange={
                  () => applySizeRule(preset.value)
                }
              />
              <span>{preset.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

NodeStylingPanel.defaultProps = {
  cytoscapeObject: null,
};

NodeStylingPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
};

export default NodeStylingPanel;
