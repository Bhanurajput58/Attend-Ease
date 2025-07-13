import React from 'react';
import './Charts.css';

/**
 * A simple line chart component
 * @param {Object} props
 * @param {Array} props.data - Array of data points, each with a value and label
 * @param {string} props.title - Chart title
 * @param {string} props.xLabel - X-axis label
 * @param {string} props.yLabel - Y-axis label
 * @param {number} props.height - Chart height in pixels
 * @param {number} props.width - Chart width in pixels (or 100% by default)
 * @param {string} props.lineColor - Line color
 * @param {boolean} props.showPoints - Whether to display points on the line
 * @param {boolean} props.showArea - Whether to display area under the line
 * @param {function} props.valueFormatter - Function to format values (defaults to value => value)
 */
const LineChart = ({
  data = [],
  title = '',
  xLabel = '',
  yLabel = '',
  height = 300,
  width = '100%',
  lineColor = '#3498db',
  showPoints = true,
  showArea = false,
  valueFormatter = value => value
}) => {
  if (!data || data.length < 2) {
    return (
      <div className="chart-container" style={{ height }}>
        <div className="chart-empty">Insufficient data for line chart (minimum 2 points needed)</div>
      </div>
    );
  }

  // Find the maximum and minimum values to scale the chart
  const values = data.map(item => item.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  
  // Add padding to prevent points from being cut off
  const range = maxValue - minValue;
  const paddedMin = Math.max(0, minValue - range * 0.05);
  const paddedMax = maxValue + range * 0.05;
  
  const chartStyle = {
    height: `${height}px`,
    width
  };

  // Create points for the polyline
  const pointsString = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100; // as percentage
    const y = 100 - ((point.value - paddedMin) / (paddedMax - paddedMin)) * 100; // inverted y axis
    return `${x},${y}`;
  }).join(' ');

  // Create points for the area polygon (if showing area)
  const areaPointsString = showArea 
    ? `0,100 ${pointsString} 100,100` 
    : '';

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      
      <div className="line-chart" style={chartStyle}>
        {yLabel && <div className="axis-label y-label">{yLabel}</div>}
        
        <div className="chart-body">
          {/* Grid lines */}
          <div className="grid-lines y-grid">
            {[0, 25, 50, 75, 100].map(percent => (
              <div key={percent} className="grid-line" style={{ bottom: `${percent}%` }}></div>
            ))}
          </div>
          
          <div className="grid-lines x-grid">
            {data.map((_, index) => (
              <div 
                key={index} 
                className="grid-line" 
                style={{ 
                  left: `${(index / (data.length - 1)) * 100}%` 
                }}
              >
              </div>
            ))}
          </div>
          
          <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Area under the line */}
            {showArea && (
              <polygon 
                points={areaPointsString} 
                fill={lineColor} 
                opacity="0.2"
              />
            )}
            
            {/* Line */}
            <polyline 
              points={pointsString} 
              fill="none" 
              stroke={lineColor} 
              strokeWidth="2"
            />
            
            {/* Points */}
            {showPoints && data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.value - paddedMin) / (paddedMax - paddedMin)) * 100;
              
              return (
                <circle 
                  key={index} 
                  cx={x} 
                  cy={y} 
                  r="2" 
                  fill="white" 
                  stroke={lineColor} 
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
          
          {/* X-axis labels */}
          <div className="x-labels">
            {data.map((point, index) => (
              <div 
                key={index} 
                className="axis-label x-point-label" 
                style={{ 
                  left: `${(index / (data.length - 1)) * 100}%` 
                }}
              >
                {point.label}
              </div>
            ))}
          </div>
          
          {/* Y-axis labels */}
          <div className="y-labels">
            {[0, 25, 50, 75, 100].map(percent => {
              const value = paddedMin + (paddedMax - paddedMin) * (1 - percent / 100);
              return (
                <div 
                  key={percent} 
                  className="axis-label y-point-label" 
                  style={{ 
                    bottom: `${percent}%` 
                  }}
                >
                  {valueFormatter(value.toFixed(1))}
                </div>
              );
            })}
          </div>
          
          {/* Tooltip for hover info - would need JS to implement fully */}
          <div className="chart-tooltip" style={{ display: 'none' }}>
            <div className="tooltip-label">Label</div>
            <div className="tooltip-value">Value</div>
          </div>
        </div>
        
        {xLabel && <div className="axis-label x-label">{xLabel}</div>}
      </div>
    </div>
  );
};

export default LineChart; 