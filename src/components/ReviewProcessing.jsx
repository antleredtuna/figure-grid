import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Line } from 'react-konva';
import useImage from 'use-image';

const ReviewProcessing = ({ image, settings, onUpdateImage }) => {
  // States for axis positions
  const [xAxisY, setXAxisY] = useState(0);
  const [yAxisX, setYAxisX] = useState(0);
  
  // States for canvases
  const [originalImage] = useImage(image?.originalUrl || '');
  const [croppedImage] = useImage(image?.croppedUrl || '');
  const [scaledImage] = useImage(image?.scaledUrl || '');
  
  // Refs for stage and layers
  const stageRef = useRef(null);
  
  // Local settings for reprocessing
  const [localSettings, setLocalSettings] = useState({});
  const [modified, setModified] = useState(false);
  
  // Initialize when image changes
  useEffect(() => {
    if (image) {
      setLocalSettings({
        whitespaceThreshold: settings.whitespaceThreshold,
        darknessThreshold: settings.darknessThreshold,
        xAxisSearchStart: settings.xAxisSearchStart,
        yAxisSearchEnd: settings.yAxisSearchEnd,
        minAxisLength: settings.minAxisLength,
        maxGapTolerance: settings.maxGapTolerance,
        minContinuityRatio: settings.minContinuityRatio,
        checkThickness: settings.checkThickness,
        thicknessRange: settings.thicknessRange
      });
      
      // Set initial axis positions
      if (image.xAxisCoords && image.xAxisCoords.length >= 2) {
        setXAxisY(image.xAxisCoords[1]); // y-coordinate of x-axis
      }
      
      if (image.yAxisCoords && image.yAxisCoords.length >= 1) {
        setYAxisX(image.yAxisCoords[0]); // x-coordinate of y-axis
      }
      
      setModified(false);
    }
  }, [image, settings]);

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : parseFloat(value);
    
    setLocalSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    setModified(true);
  };

  const handleSaveChanges = () => {
    if (!image) return;
    
    // Calculate new percentages
    const newPercentages = {
      xAxis: xAxisY / image.scaledHeight,
      yAxis: yAxisX / image.scaledWidth
    };
    
    // Create updated image object
    const updatedImage = {
      ...image,
      xAxisCoords: [0, xAxisY, image.scaledWidth, xAxisY],
      yAxisCoords: [yAxisX, 0, yAxisX, image.scaledHeight],
      percentages: newPercentages
    };
    
    // Update visualization with new axes
    const canvas = document.createElement('canvas');
    canvas.width = image.scaledWidth;
    canvas.height = image.scaledHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw the scaled image
    const img = document.createElement('img');
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      
      // Draw x-axis (red)
      ctx.beginPath();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.moveTo(0, xAxisY);
      ctx.lineTo(image.scaledWidth, xAxisY);
      ctx.stroke();
      
      // Draw y-axis (blue)
      ctx.beginPath();
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.moveTo(yAxisX, 0);
      ctx.lineTo(yAxisX, image.scaledHeight);
      ctx.stroke();
      
      // Update the visualizationUrl
      updatedImage.visualizationUrl = canvas.toDataURL();
      
      // Save changes
      onUpdateImage(updatedImage);
      setModified(false);
    };
    
    img.src = image.scaledUrl;
  };
  
  const handleDiscardChanges = () => {
    if (!image) return;
    
    // Reset to original values
    if (image.xAxisCoords && image.xAxisCoords.length >= 2) {
      setXAxisY(image.xAxisCoords[1]);
    }
    
    if (image.yAxisCoords && image.yAxisCoords.length >= 1) {
      setYAxisX(image.yAxisCoords[0]);
    }
    
    setLocalSettings({
      whitespaceThreshold: settings.whitespaceThreshold,
      darknessThreshold: settings.darknessThreshold,
      xAxisSearchStart: settings.xAxisSearchStart,
      yAxisSearchEnd: settings.yAxisSearchEnd,
      minAxisLength: settings.minAxisLength,
      maxGapTolerance: settings.maxGapTolerance,
      minContinuityRatio: settings.minContinuityRatio,
      checkThickness: settings.checkThickness,
      thicknessRange: settings.thicknessRange
    });
    
    setModified(false);
  };
  
  // Reprocess image is not implemented as it would require browser implementation
  // of the crop and detect functions. This would be implemented in a full application.
  
  if (!image) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select an image to review processing</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Review Processing: {image.fileName}</h2>
        
        <div className="flex space-x-2">
          <button 
            className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 disabled:bg-gray-400"
            onClick={handleDiscardChanges}
            disabled={!modified}
          >
            Discard Changes
          </button>
          
          <button 
            className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 disabled:bg-gray-400"
            onClick={handleSaveChanges}
            disabled={!modified}
          >
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Canvas Preview */}
        <div className="flex-1 border border-gray-300 rounded overflow-hidden">
          <Stage 
            width={image.scaledWidth} 
            height={image.scaledHeight}
            ref={stageRef}
          >
            <Layer>
              {/* Original image (greyed out) */}
              {scaledImage && (
                <Image
                  image={scaledImage}
                  opacity={0.5}
                  width={image.scaledWidth}
                  height={image.scaledHeight}
                />
              )}
              
              {/* X-Axis Line */}
              <Line
                points={[0, xAxisY, image.scaledWidth, xAxisY]}
                stroke="red"
                strokeWidth={2}
                draggable
                dragBoundFunc={(pos) => {
                  setModified(true);
                  return {
                    x: 0,
                    y: Math.max(0, Math.min(image.scaledHeight, pos.y))
                  };
                }}
                onDragMove={(e) => {
                  setXAxisY(e.target.y());
                }}
              />
              
              {/* Y-Axis Line */}
              <Line
                points={[yAxisX, 0, yAxisX, image.scaledHeight]}
                stroke="blue"
                strokeWidth={2}
                draggable
                dragBoundFunc={(pos) => {
                  setModified(true);
                  return {
                    x: Math.max(0, Math.min(image.scaledWidth, pos.x)),
                    y: 0
                  };
                }}
                onDragMove={(e) => {
                  setYAxisX(e.target.x());
                }}
              />
            </Layer>
          </Stage>
        </div>
        
        {/* Settings Panel */}
        <div className="w-64 ml-4">
          <div className="bg-gray-100 rounded p-3 mb-4">
            <h3 className="font-semibold mb-2">Axes Positions</h3>
            
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">X-Axis Position (Y)</label>
              <input
                type="range"
                min={0}
                max={image.scaledHeight}
                value={xAxisY}
                onChange={(e) => {
                  setXAxisY(parseInt(e.target.value));
                  setModified(true);
                }}
                className="w-full"
              />
              <div className="text-sm text-center">{xAxisY}px ({(xAxisY / image.scaledHeight * 100).toFixed(1)}%)</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Y-Axis Position (X)</label>
              <input
                type="range"
                min={0}
                max={image.scaledWidth}
                value={yAxisX}
                onChange={(e) => {
                  setYAxisX(parseInt(e.target.value));
                  setModified(true);
                }}
                className="w-full"
              />
              <div className="text-sm text-center">{yAxisX}px ({(yAxisX / image.scaledWidth * 100).toFixed(1)}%)</div>
            </div>
          </div>
          
          {/* Image Info */}
          <div className="bg-gray-100 rounded p-3">
            <h3 className="font-semibold mb-2">Image Details</h3>
            <div className="text-sm">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div>Original:</div>
                <div>{image.originalWidth}×{image.originalHeight}</div>
                
                <div>Cropped:</div>
                <div>{image.croppedWidth}×{image.croppedHeight}</div>
                
                <div>Scaled:</div>
                <div>{image.scaledWidth}×{image.scaledHeight}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewProcessing;