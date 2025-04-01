import React from 'react';
import './Charts.css';

/**
 * A simple bar chart component
 * @param {Object} props
 * @param {Array} props.data - Array of data points, each with a value, label, and optionally color
 * @param {string} props.title - Chart title
 * @param {string} props.xLabel - X-axis label
 * @param {string} props.yLabel - Y-axis label
 * @param {number} props.height - Chart height in pixels
 * @param {string} props.defaultColor - Default bar color if not specified in data
 * @param {boolean} props.horizontal - Whether to display bars horizontally
 * @param {boolean} props.showValues - Whether to display values on bars
 * @param {function} props.valueFormatter - Function to format values (defaults to value => value)
 */
const BarChart = ({ 
  data = [], 
  title = '',
  xLabel = '',
  yLabel = '',
  height = 300,
  defaultColor = '#3498db',
  horizontal = false,
  showValues = true,
  valueFormatter = value => value
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container" style={{ height }}>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  // Find the maximum value to scale the bars
  const maxValue = Math.max(...data.map(item => item.value));
  
  const chartStyle = {
    height: `${height}px`
  };

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      
      <div className={`bar-chart ${horizontal ? 'horizontal' : 'vertical'}`} style={chartStyle}>
        {yLabel && <div className="axis-label y-label">{yLabel}</div>}
        
        <div className="chart-body">
          {data.map((item, index) => {
            const barSize = (item.value / maxValue) * 100;
            const barStyle = horizontal 
              ? { width: `${barSize}%`, backgroundColor: item.color || defaultColor }
              : { height: `${barSize}%`, backgroundColor: item.color || defaultColor };
              
            return (
              <div key={index} className="bar-container">
                <div className="bar" style={barStyle}>
                  {showValues && (
                    <span className="bar-value">
                      {valueFormatter(item.value)}
                    </span>
                  )}
                </div>
                <div className="bar-label">{item.label}</div>
              </div>
            );
          })}
        </div>
        
        {xLabel && <div className="axis-label x-label">{xLabel}</div>}
      </div>
    </div>
  );
};

export default BarChart; 