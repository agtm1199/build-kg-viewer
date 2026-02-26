import React from 'react';
import PropTypes from 'prop-types';
import { Spin, Button } from 'antd';
import './QueryLoadingOverlay.css';

const QueryLoadingOverlay = ({ reqString, onCancel }) => (
  <div className="query-loading-overlay">
    <div className="loading-content">
      <Spin size="large" />
      <p className="loading-text">Executing query...</p>
      <p className="loading-query">{reqString}</p>
      {onCancel && (
        <Button size="small" danger onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  </div>
);

QueryLoadingOverlay.defaultProps = {
  onCancel: null,
};

QueryLoadingOverlay.propTypes = {
  reqString: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
};

export default QueryLoadingOverlay;
