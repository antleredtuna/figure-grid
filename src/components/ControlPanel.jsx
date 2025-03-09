import React from 'react';

const ControlPanel = ({ settings, onChange }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : 
                     type === 'number' ? parseFloat(value) : value;
    
    onChange({ [name]: newValue });
  };
  
  const SettingSlider = ({ name, label, min, max, step, description }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={name} className="font-medium">{label}</label>
        <span className="text-sm bg-gray-200 rounded px-2 py-1">
          {settings[name]}
        </span>
      </div>
      
      <input
        type="range"
        id={name}
        name={name}
        min={min}
        max={max}
        step={step}
        value={settings[name]}
        onChange={handleChange}
        className="w-full"
      />
      
      {description && (
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      )}
    </div>
  );
  
  const SettingCheckbox = ({ name, label, description }) => (
    <div className="mb-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={settings[name]}
          onChange={handleChange}
          className="h-4 w-4 mr-2"
        />
        <label htmlFor={name} className="font-medium">{label}</label>
      </div>
      
      {description && (
        <p className="text-xs text-gray-600 mt-1 ml-6">{description}</p>
      )}
    </div>
  );
  
  const SettingNumber = ({ name, label, min, max, step, description }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={name} className="font-medium">{label}</label>
      </div>
      
      <input
        type="number"
        id={name}
        name={name}
        min={min}
        max={max}
        step={step}
        value={settings[name]}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded p-2"
      />
      
      {description && (
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      )}
    </div>
  );

  return (
    <div className="p-4 h-full overflow-auto">
      <h2 className="text-xl font-bold mb-4">Control Panel</h2>
      
      {/* Grid Settings */}
      <div className="mb-6 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-3">Grid Settings</h3>
        
        <SettingNumber
          name="cellWidth"
          label="Cell Width (px)"
          min={100}
          max={1000}
          step={10}
          description="Standard width for scaled images"
        />
        
        <SettingNumber
          name="numRows"
          label="Number of Rows"
          min={1}
          max={4}
          step={1}
          description="Number of rows in the grid"
        />
        
        <SettingNumber
          name="numColumns"
          label="Number of Columns"
          min={1}
          max={4}
          step={1}
          description="Number of columns in the grid"
        />
      </div>
      
      {/* Image Processing Settings */}
      <div className="mb-6 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-3">Image Processing</h3>
        
        <SettingSlider
          name="whitespaceThreshold"
          label="Whitespace Threshold"
          min={200}
          max={254}
          step={1}
          description="Pixels with RGB values above this are considered whitespace (higher = more aggressive cropping)"
        />
      </div>
      
      {/* Axes Detection Settings */}
      <div className="p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-3">Axes Detection</h3>
        
        <SettingSlider
          name="darknessThreshold"
          label="Darkness Threshold"
          min={50}
          max={200}
          step={1}
          description="Pixels with RGB values below this are considered part of axes"
        />
        
        <SettingSlider
          name="xAxisSearchStart"
          label="X-Axis Search Start"
          min={0.5}
          max={0.9}
          step={0.01}
          description="Vertical position to start searching for horizontal axes (as % from top)"
        />
        
        <SettingSlider
          name="yAxisSearchEnd"
          label="Y-Axis Search End"
          min={0.05}
          max={0.3}
          step={0.01}
          description="Horizontal position to end searching for vertical axes (as % from left)"
        />
        
        <SettingSlider
          name="minAxisLength"
          label="Minimum Axis Length"
          min={0.2}
          max={0.8}
          step={0.05}
          description="Minimum length of axes as proportion of image dimensions"
        />
        
        <SettingSlider
          name="maxGapTolerance"
          label="Max Gap Tolerance"
          min={1}
          max={10}
          step={1}
          description="Maximum allowed gap in pixels when detecting axes"
        />
        
        <SettingSlider
          name="minContinuityRatio"
          label="Min Continuity Ratio"
          min={0.5}
          max={0.95}
          step={0.05}
          description="Minimum ratio of dark pixels required for axes detection"
        />
        
        <SettingCheckbox
          name="checkThickness"
          label="Check Line Thickness"
          description="Consider line thickness in axes detection"
        />
        
        <SettingSlider
          name="thicknessRange"
          label="Thickness Check Range"
          min={1}
          max={5}
          step={1}
          description="Range of pixels to check for thickness consistency"
        />
      </div>
    </div>
  );
};

export default ControlPanel;