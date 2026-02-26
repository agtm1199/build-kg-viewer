import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import {
  faStar as faStarOutline,
} from '@fortawesome/free-regular-svg-icons';
import './QueryHistoryPanel.css';

const QueryHistoryPanel = ({
  visible,
  commandHistory,
  commandFavorites,
  onSelect,
  onToggleFavorite,
}) => {
  const [activeTab, setActiveTab] = useState(
    'history',
  );

  if (!visible) return null;

  const isFavorite = (cmd) => (
    commandFavorites.includes(cmd)
  );

  const dedupHistory = [...new Set(
    [...commandHistory].reverse(),
  )].slice(0, 50);

  return (
    <div className="query-history-panel">
      <div className="query-history-tabs">
        <button
          type="button"
          className={
            `query-history-tab${
              activeTab === 'history'
                ? ' active' : ''}`
          }
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          type="button"
          className={
            `query-history-tab${
              activeTab === 'favorites'
                ? ' active' : ''}`
          }
          onClick={() => setActiveTab('favorites')}
        >
          Favorites
        </button>
      </div>
      <div className="query-history-list">
        {activeTab === 'history' && (
          dedupHistory.length === 0 ? (
            <div className="query-history-empty">
              No query history yet
            </div>
          ) : (
            dedupHistory.map((cmd) => (
              <div
                key={cmd}
                className="query-history-row"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(cmd)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSelect(cmd);
                  }
                }}
              >
                <span
                  className="query-history-cmd"
                >
                  {cmd}
                </span>
                <button
                  type="button"
                  className={
                    `query-history-star${
                      isFavorite(cmd)
                        ? ' starred' : ''}`
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(cmd);
                  }}
                  title={
                    isFavorite(cmd)
                      ? 'Remove favorite'
                      : 'Add favorite'
                  }
                >
                  <FontAwesomeIcon
                    icon={
                      isFavorite(cmd)
                        ? faStar : faStarOutline
                    }
                  />
                </button>
              </div>
            ))
          )
        )}
        {activeTab === 'favorites' && (
          commandFavorites.length === 0 ? (
            <div className="query-history-empty">
              No favorite queries yet
            </div>
          ) : (
            commandFavorites.map((cmd) => (
              <div
                key={cmd}
                className="query-history-row"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(cmd)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSelect(cmd);
                  }
                }}
              >
                <span
                  className="query-history-cmd"
                >
                  {cmd}
                </span>
                <button
                  type="button"
                  className="query-history-star starred"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(cmd);
                  }}
                  title="Remove favorite"
                >
                  <FontAwesomeIcon icon={faStar} />
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

QueryHistoryPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  commandHistory: PropTypes.arrayOf(
    PropTypes.string,
  ).isRequired,
  commandFavorites: PropTypes.arrayOf(
    PropTypes.string,
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
};

export default QueryHistoryPanel;
