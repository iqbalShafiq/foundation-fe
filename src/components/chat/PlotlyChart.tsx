import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface PlotlyChartProps {
  data: string | object; // JSON string or object containing chart data
  className?: string;
}

// Default layout with dark theme
const getDefaultLayout = () => ({
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: {
    color: '#f3f4f6', // gray-100
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  xaxis: {
    gridcolor: '#374151', // gray-700
    zerolinecolor: '#6b7280', // gray-500
    linecolor: '#6b7280',
    tickcolor: '#6b7280',
    color: '#f3f4f6'
  },
  yaxis: {
    gridcolor: '#374151',
    zerolinecolor: '#6b7280',
    linecolor: '#6b7280',
    tickcolor: '#6b7280',
    color: '#f3f4f6'
  },
  legend: {
    font: {
      color: '#f3f4f6'
    }
  },
  margin: {
    t: 40,
    r: 40,
    b: 40,
    l: 40
  }
});

// Default config options
const getDefaultConfig = () => ({
  displayModeBar: true,
  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
  displaylogo: false,
  responsive: true
});

export const PlotlyChart: React.FC<PlotlyChartProps> = ({ data, className = '' }) => {
  const chartConfigs = useMemo(() => {
    try {
      let parsedData;

      // Handle both string and object inputs
      if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      } else {
        parsedData = data;
      }

      // Handle multiple charts
      if (parsedData.charts && Array.isArray(parsedData.charts)) {
        // Multiple charts format from new backend
        return parsedData.charts.map((chart: any) => {
          const plotlyConfig = chart.chart_data || chart;

          if (!plotlyConfig.data || !Array.isArray(plotlyConfig.data)) {
            throw new Error('Invalid chart data: missing or invalid data array');
          }

          return {
            data: plotlyConfig.data,
            layout: { ...getDefaultLayout(), ...plotlyConfig.layout },
            config: { ...getDefaultConfig(), ...(plotlyConfig.config || {}) }
          };
        });
      }

      // Handle single chart (backward compatible)
      let plotlyConfig;
      if (parsedData.chart_data) {
        plotlyConfig = parsedData.chart_data;
      } else if (parsedData.data) {
        // Direct Plotly format
        plotlyConfig = parsedData;
      } else {
        plotlyConfig = parsedData;
      }
      
      // Ensure the config has the required structure
      if (!plotlyConfig.data || !Array.isArray(plotlyConfig.data)) {
        throw new Error('Invalid chart data: missing or invalid data array');
      }

      // Return single chart configuration wrapped in array for consistent handling
      return [{
        data: plotlyConfig.data,
        layout: { ...getDefaultLayout(), ...plotlyConfig.layout },
        config: { ...getDefaultConfig(), ...(plotlyConfig.config || {}) }
      }];
    } catch (error) {
      console.error('Failed to parse chart data:', error);
      return null;
    }
  }, [data]);

  if (!chartConfigs || chartConfigs.length === 0) {
    return (
      <div className={`p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400 ${className}`}>
        <p className="text-sm">Failed to render chart: Invalid chart data format</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {chartConfigs.map((chartConfig, index) => (
        <div key={index} className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${index > 0 ? 'mt-4' : ''}`}>
          <Plot
            data={chartConfig.data}
            layout={chartConfig.layout}
            config={chartConfig.config}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        </div>
      ))}
    </div>
  );
};

export default PlotlyChart;