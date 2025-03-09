import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Rect } from 'react-konva';
import { createImageGrid } from '../utils';
import saveAs from 'file-saver';

const MainGrid = ({ 
  numRows, 
  numColumns, 
  gridLayout, 
  onRemoveImage,
  onAlignedGrid,
  alignedGrid,
  selectedCell,
  setSelectedCell
}) => {
  const [alignmentInProgress, setAlignmentInProgress] = useState(false);
  const [alignedImageElement, setAlignedImageElement] = useState(null);

  // Load aligned grid image when it changes
  useEffect(() => {
    if (alignedGrid?.dataUrl) {
      // Create image element using document.createElement instead of new Image()
      const img = document.createElement('img');
      img.onload = () => {
        setAlignedImageElement(img);
      };
      img.src = alignedGrid.dataUrl;
    } else {
      setAlignedImageElement(null);
    }
  }, [alignedGrid]);

  const handleCellClick = (rowIndex, colIndex) => {
    const position = `${rowIndex}-${colIndex}`;
    setSelectedCell(position);
  };

  // This is now handled by the ThumbnailsPanel through App.jsx

  const handleRemoveImage = () => {
    if (selectedCell) {
      onRemoveImage(selectedCell);
      setSelectedCell(null);
    }
  };

  const handleAlignToAxes = async () => {
    // Check if we have enough images in the grid
    const cellCount = Object.keys(gridLayout).length;
    if (cellCount === 0) {
      alert('Please assign at least one image to the grid before aligning.');
      return;
    }
    
    setAlignmentInProgress(true);
    
    try {
      // Prepare images data for the createImageGrid function
      const imagesData = {};
      
      // Map grid positions to correct IDs as expected by createImageGrid
      // For a 2x2 grid the correct mapping is:
      // Position 0-0 (top-left) → ID 1
      // Position 0-1 (top-right) → ID 2
      // Position 1-0 (bottom-left) → ID 3
      // Position 1-1 (bottom-right) → ID 4
      
      const positionToIdMap = {
        '0-0': 1, // Top-left
        '0-1': 2, // Top-right
        '1-0': 3, // Bottom-left
        '1-1': 4  // Bottom-right
      };
      
      for (const [position, image] of Object.entries(gridLayout)) {
        // Get correct ID directly from the mapping
        const id = positionToIdMap[position];
        
        console.log(`Grid position ${position} maps to ID ${id}`);
        
        imagesData[id] = {
          url: image.scaledUrl,
          width: image.scaledWidth,
          height: image.scaledHeight,
          yAxisPercent: image.percentages.yAxis,
          xAxisPercent: image.percentages.xAxis,
          path: image.scaledUrl // Path is used by the original function, we use URL instead
        };
      }
      
      // Call the createImageGrid function
      const result = await createImageGrid(imagesData);
      
      // Pass the result to the parent component
      onAlignedGrid(result);
    } catch (error) {
      console.error('Error aligning grid:', error);
      alert(`Error aligning grid: ${error.message}`);
    } finally {
      setAlignmentInProgress(false);
    }
  };

  const handleSaveCanvas = () => {
    if (!alignedGrid) {
      alert('Please align the grid first before saving.');
      return;
    }
    
    // Convert data URL to Blob
    fetch(alignedGrid.dataUrl)
      .then(res => res.blob())
      .then(blob => {
        // Save using FileSaver.js
        saveAs(blob, 'aligned-grid.png');
      })
      .catch(error => {
        console.error('Error saving canvas:', error);
        alert(`Error saving canvas: ${error.message}`);
      });
  };

  const handleResetGrid = () => {
    // Confirm reset
    if (window.confirm('Are you sure you want to reset the grid? This will remove all aligned images.')) {
      onAlignedGrid(null);
    }
  };

  // Render grid cells
  const renderGridCells = () => {
    const cells = [];
    const cellWidth = 150;
    const cellHeight = 150;
    
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        const position = `${row}-${col}`;
        const isSelected = position === selectedCell;
        const image = gridLayout[position];
        
        cells.push(
          <div
            key={position}
            className={`relative border-2 ${isSelected ? 'border-blue-500' : 'border-gray-300'} 
                       rounded overflow-hidden cursor-pointer`}
            style={{ width: cellWidth, height: cellHeight }}
            onClick={() => handleCellClick(row, col)}
          >
            {image ? (
              <>
                <img 
                  src={image.visualizationUrl} 
                  alt={image.fileName}
                  className="w-full h-full object-contain"
                />
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  <div className="truncate">{image.fileName}</div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
                Empty Cell
              </div>
            )}
            
            <div className="absolute top-0 left-0 text-xs bg-black bg-opacity-50 text-white px-1">
              {row + 1},{col + 1}
            </div>
          </div>
        );
      }
    }
    
    return (
      <div className="grid grid-cols-2 gap-4">
        {cells}
      </div>
    );
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Grid Layout</h2>
        
        <div className="flex space-x-2">
          <button 
            className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
            onClick={handleAlignToAxes}
            disabled={alignmentInProgress || Object.keys(gridLayout).length === 0}
          >
            {alignmentInProgress ? 'Aligning...' : 'Align to Axes'}
          </button>
          
          {alignedGrid && (
            <>
              <button 
                className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
                onClick={handleSaveCanvas}
              >
                Save Canvas
              </button>
              
              <button 
                className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                onClick={handleResetGrid}
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Grid Layout */}
        <div className="w-1/3 flex flex-col">
          <h3 className="font-semibold mb-2">Grid Layout</h3>
          
          {/* Grid Cells */}
          <div className="mb-4">
            {renderGridCells()}
          </div>
          
          {/* Selected Cell Actions */}
          {selectedCell && (
            <div className="bg-gray-100 p-3 rounded">
              <h4 className="font-medium mb-2">Cell Actions</h4>
              
              <div className="flex space-x-2">
                {gridLayout[selectedCell] ? (
                  <button 
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                    onClick={handleRemoveImage}
                  >
                    Remove Image
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">Select an image from Thumbnails panel to add to this cell</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Aligned Grid (when available) */}
        <div className="w-2/3 pl-4 flex flex-col">
          {alignedGrid ? (
            <div className="flex-1 flex flex-col">
              <h3 className="font-semibold mb-2">Aligned Grid</h3>
              
              <div className="flex-1 border border-gray-300 rounded overflow-auto">
                {alignedImageElement && (
                  <div>
                    <img 
                      src={alignedGrid.dataUrl} 
                      alt="Aligned Grid" 
                      className="max-w-full"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                <p>Canvas size: {alignedGrid.width} × {alignedGrid.height}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded p-4">
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-2">No Aligned Grid Yet</p>
                <p className="text-sm text-gray-500">
                  1. Select a cell in the grid layout<br/>
                  2. Click on an image in the Thumbnails panel to assign it<br/>
                  3. Click "Align to Axes" to create the aligned grid
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainGrid;