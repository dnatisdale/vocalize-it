import React, { useState } from 'react';
import { getDatasetWarnings } from '../../utils/structuredDataDetector';

export function DatasetControls({ datasetInfo, onCancel, onSummarize, onReadColumns, onNarrative, onExtract }) {
  const { rowCount, columnCount, documentType, headers } = datasetInfo;
  const { rowWarning, colWarning } = getDatasetWarnings(rowCount, columnCount);

  // Column Selector state
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(() => {
    // Select first column by default if available
    if (headers && headers.length > 0) return [headers[0]];
    return [];
  });
  const [maxRows, setMaxRows] = useState(100);

  const toggleColumn = (col) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter(c => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const handleReadColumns = () => {
    onReadColumns(selectedColumns, maxRows);
    setShowColumnSelector(false);
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      
      {/* Warning Header */}
      <div style={{ backgroundColor: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.3)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span> 
          {documentType === 'Bible-dataset' ? 'Bible Dataset Detected' : 'Structured Tabular Data Detected'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px 0', fontSize: '0.9rem' }}>
          <span className="brand-text-inline"><img src="/pwa-192x192.png" alt="" className="inline-brand-logo" />Listen<span style={{ width: "0.5em", display: "inline-block" }}></span>Better</span> has intercepted {rowCount} rows and {columnCount} columns. Processing large spreadsheets natively will result in a confusing listening experience.
        </p>
        
        {rowWarning && (
          <div style={{ fontSize: '0.85rem', color: '#eab308', marginBottom: '4px' }}>• {rowWarning}</div>
        )}
        {colWarning && (
          <div style={{ fontSize: '0.85rem', color: '#eab308' }}>• {colWarning}</div>
        )}
      </div>

      {showColumnSelector ? (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>Select Columns to Read</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {headers && headers.map(h => (
              <button 
                key={h}
                onClick={() => toggleColumn(h)}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  border: '1px solid',
                  borderColor: selectedColumns.includes(h) ? 'var(--accent-color)' : 'var(--border-color)',
                  backgroundColor: selectedColumns.includes(h) ? 'var(--accent-color)' : 'transparent',
                  color: selectedColumns.includes(h) ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {h}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Maximum Rows to Process</label>
            <input 
              type="number" 
              value={maxRows} 
              onChange={(e) => setMaxRows(parseInt(e.target.value) || 100)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="primary-btn" onClick={handleReadColumns}>Read Selection</button>
            <button className="secondary-btn" onClick={() => setShowColumnSelector(false)}>Back</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <button className="primary-btn" onClick={onSummarize}>
            Summarize Dataset
          </button>
          
          <button className="primary-btn" onClick={() => setShowColumnSelector(true)}>
            Read Selected Columns
          </button>
          
          <button className="secondary-btn" onClick={onNarrative}>
            Convert Rows to Narrative
          </button>
          
          <button className="secondary-btn" onClick={onExtract}>
            Extract Key Insights
          </button>
          
          <button className="icon-btn" onClick={onCancel} style={{ gridColumn: '1 / -1', marginTop: '12px', padding: '12px', textAlign: 'center', backgroundColor: 'transparent', border: '1px dashed var(--border-color)' }}>
            Cancel & Clear
          </button>
        </div>
      )}
    </div>
  );
}
