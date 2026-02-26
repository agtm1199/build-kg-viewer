import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEyeSlash,
  faLock,
  faExchangeAlt,
  faTags,
  faCompress,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import './BatchOperationsBar.css';

const BatchOperationsBar = ({
  cytoscapeObject,
  selectedCount,
  onBeforeRemove,
}) => {
  if (!cytoscapeObject || selectedCount < 2) {
    return null;
  }

  const hideSelected = () => {
    if (onBeforeRemove) onBeforeRemove();
    cytoscapeObject.elements(':selected').remove();
  };

  const lockSelected = () => {
    const sel = cytoscapeObject
      .nodes(':selected');
    const allLocked = sel.every(
      (n) => n.locked(),
    );
    if (allLocked) {
      sel.unlock();
    } else {
      sel.lock();
    }
  };

  const invertSelection = () => {
    const selected = cytoscapeObject
      .nodes(':selected');
    const unselected = cytoscapeObject
      .nodes(':unselected');
    selected.unselect().selectify();
    unselected.selectify().select()
      .unselectify();
  };

  const selectSameLabel = () => {
    const first = cytoscapeObject
      .nodes(':selected').first();
    if (!first || first.empty()) return;
    const lbl = first.data('label');
    cytoscapeObject
      .nodes(`[label = "${lbl}"]`)
      .selectify().select().unselectify();
  };

  const fitToSelected = () => {
    cytoscapeObject.fit(
      cytoscapeObject.elements(':selected'), 50,
    );
  };

  const clearSelection = () => {
    cytoscapeObject.elements(':selected')
      .unselect().selectify();
  };

  return (
    <div className="batch-bar">
      <span className="batch-bar-count">
        {selectedCount}
        {' selected'}
      </span>
      <button
        type="button"
        className="batch-bar-btn"
        onClick={hideSelected}
        title="Hide selected"
      >
        <FontAwesomeIcon icon={faEyeSlash} />
        Hide
      </button>
      <button
        type="button"
        className="batch-bar-btn"
        onClick={lockSelected}
        title="Lock/Unlock selected"
      >
        <FontAwesomeIcon icon={faLock} />
        Lock
      </button>
      <button
        type="button"
        className="batch-bar-btn"
        onClick={invertSelection}
        title="Invert selection"
      >
        <FontAwesomeIcon icon={faExchangeAlt} />
        Invert
      </button>
      <button
        type="button"
        className="batch-bar-btn"
        onClick={selectSameLabel}
        title="Select all with same label"
      >
        <FontAwesomeIcon icon={faTags} />
        Same Label
      </button>
      <button
        type="button"
        className="batch-bar-btn"
        onClick={fitToSelected}
        title="Fit viewport to selected"
      >
        <FontAwesomeIcon icon={faCompress} />
        Fit
      </button>
      <button
        type="button"
        className="batch-bar-clear"
        onClick={clearSelection}
      >
        <FontAwesomeIcon icon={faTimes} />
        {' Clear'}
      </button>
    </div>
  );
};

BatchOperationsBar.defaultProps = {
  cytoscapeObject: null,
  onBeforeRemove: null,
};

BatchOperationsBar.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
  selectedCount: PropTypes.number.isRequired,
  onBeforeRemove: PropTypes.func,
};

export default BatchOperationsBar;
