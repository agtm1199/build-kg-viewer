import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AutoComplete, Input } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import './GraphSearchBar.css';

const GraphSearchBar = ({ cytoscapeObject }) => {
  const [options, setOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const onSearch = useCallback((text) => {
    setSearchValue(text);
    if (!cytoscapeObject || !text || text.length < 2) {
      setOptions([]);
      return;
    }
    const lowerText = text.toLowerCase();
    const matches = [];
    cytoscapeObject.nodes().forEach((node) => {
      const data = node.data();
      const searchable = [data.label, String(data.id)]
        .concat(Object.values(data.properties || {}).map(String))
        .filter(Boolean);
      if (searchable.some((val) => val.toLowerCase().includes(lowerText))) {
        const display = data.properties?.name
          || data.properties?.id
          || data.properties?.provision_id
          || String(data.id);
        matches.push({
          value: String(data.id),
          label: `[${data.label}] ${display}`,
        });
      }
    });
    setOptions(matches.slice(0, 20));
  }, [cytoscapeObject]);

  const onSelect = useCallback((nodeId) => {
    if (!cytoscapeObject) return;
    const node = cytoscapeObject.getElementById(nodeId);
    if (node.length === 0) return;
    cytoscapeObject.elements(':selected').unselect();
    node.select();
    cytoscapeObject.animate({ center: { eles: node }, zoom: 2 }, { duration: 300 });
    node.flashClass('highlight', 1500);
    setSearchValue('');
    setOptions([]);
  }, [cytoscapeObject]);

  return (
    <div className="graph-search-bar">
      <AutoComplete
        options={options}
        onSearch={onSearch}
        onSelect={onSelect}
        value={searchValue}
        onChange={setSearchValue}
        style={{ width: '100%' }}
        notFoundContent={searchValue.length >= 2 ? 'No matches' : null}
      >
        <Input
          prefix={<FontAwesomeIcon icon={faSearch} style={{ color: '#999' }} />}
          placeholder="Search nodes..."
          size="small"
          id="graph-search-input"
          allowClear
        />
      </AutoComplete>
    </div>
  );
};

GraphSearchBar.defaultProps = {
  cytoscapeObject: null,
};

GraphSearchBar.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
};

export default GraphSearchBar;
