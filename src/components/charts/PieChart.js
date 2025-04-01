import React from 'react';
import './Charts.css';

/**
 * A simple pie chart component
 * @param {Object} props
 * @param {Array} props.data - Array of data points, each with a value, label, and optionally color
 * @param {string} props.title - Chart title
 * @param {number} props.size - Chart size in pixels (diameter)
 * @param {boolean} props.showLegend - Whether to display the legend
 * @param {boolean} props.showPercentage - Whether to display percentage in the legend
 * @param {function} props.valueFormatter - Function to format values (defaults to value => value)
 */
const PieChart = ({
  data = [],
  title = '',
  size = 200,
  showLegend = true,
  showPercentage = true,
  valueFormatter = value => value
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  // Default colors if not provided in data
  const defaultColors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
  ];

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const color = item.color || defaultColors[index % defaultColors.length];
    
    // Create the CSS for the slice
    const sliceStyle = {
      transform: `rotate(${startAngle}deg)`,
      backgroundColor: color,
      clipPath: angle <= 180 
        ? `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(angle * Math.PI / 180)}% ${50 - 50 * Math.cos(angle * Math.PI / 180)}%)`
        : `polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%, ${50 + 50 * Math.sin(angle * Math.PI / 180)}% ${50 - 50 * Math.cos(angle * Math.PI / 180)}%)`
    };
    
    return {
      ...item,
      percentage,
      angle,
      startAngle,
      endAngle,
      color,
      sliceStyle
    };
  });

  return (
    <div className="chart-container pie-chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      
      <div className="pie-chart-wrapper">
        <div 
          className="pie-chart" 
          style={{ 
            width: `${size}px`, 
            height: `${size}px` 
          }}
        >
          {slices.map((slice, index) => (
            <div
              key={index}
              className="pie-slice"
              style={{
                ...slice.sliceStyle,
                clipPath: slice.angle > 180 
                  ? 'none' // For slices > 180 degrees, we'll handle with overlay
                  : slice.sliceStyle.clipPath,
                zIndex: 10 - index // Ensure proper layering
              }}
            />
          ))}
          
          {/* For slices > 180 degrees, we need an overlay */}
          {slices.map((slice, index) => (
            slice.angle > 180 && (
              <div
                key={`overlay-${index}`}
                className="pie-slice pie-slice-overlay"
                style={{
                  transform: `rotate(${slice.startAngle + 180}deg)`,
                  backgroundColor: slice.color,
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((slice.angle - 180) * Math.PI / 180)}% ${50 - 50 * Math.cos((slice.angle - 180) * Math.PI / 180)}%)`,
                  zIndex: 10 - index - 0.5 // Ensure proper layering
                }}
              />
            )
          ))}
        </div>
      </div>
      
      {showLegend && (
        <div className="pie-legend">
          {slices.map((slice, index) => (
            <div key={index} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: slice.color }}></div>
              <div className="legend-label">
                {slice.label}
                {showPercentage && (
                  <span className="legend-percentage">
                    {slice.percentage.toFixed(1)}% ({valueFormatter(slice.value)})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PieChart; 