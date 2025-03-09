import React, { useRef } from 'react';
import { processImageForGrid } from '../utils';

const ThumbnailsPanel = ({ images, selectedImage, onSelect, onDelete, onAdd, settings, gridLayout = {}, selectedCell = null, onAssignToGrid = () => {} }) => {
  const fileInputRef = useRef(null);
  
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // Process all selected files
    const processingPromises = files.map(file => 
      processImageForGrid(file, settings)
    );
    
    try {
      // Show processing indicator
      const results = await Promise.all(processingPromises);
      onAdd(results);
    } catch (error) {
      console.error('Error processing images:', error);
      alert(`Error processing images: ${error.message}`);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Upload Button */}
      <div className="mb-4">
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          multiple 
          accept="image/*" 
          onChange={handleFileSelect} 
        />
        <button 
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          onClick={() => fileInputRef.current.click()}
        >
          Import Images
        </button>
      </div>
      
      {/* Thumbnails Grid */}
      <div className="flex-1 overflow-auto grid grid-cols-2 gap-4">
        {images.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center h-32 bg-gray-100 rounded">
            <p className="text-gray-500">No images imported yet</p>
          </div>
        ) : (
          images.map((image) => {
            // Check if this image is used in the grid
            const isAssigned = Object.values(gridLayout).some(img => img && img.fileName === image.fileName);
            const gridPosition = Object.entries(gridLayout).find(([pos, img]) => img && img.fileName === image.fileName)?.[0];
            
            return (
              <div 
                key={image.fileName}
                className={`relative border-2 rounded overflow-hidden cursor-pointer ${
                  selectedImage && selectedImage.fileName === image.fileName 
                    ? 'border-blue-500' 
                    : isAssigned ? 'border-green-500' : 'border-gray-300'
                }`}
                onClick={() => {
                  onSelect(image);
                  
                  // If a cell is selected in the grid, assign this image
                  if (selectedCell && !gridLayout[selectedCell]) {
                    onAssignToGrid(image, selectedCell);
                  }
                }}
              >
                {/* Image with Axes Overlay */}
                <div className="relative">
                  <img 
                    src={image.visualizationUrl} 
                    alt={image.fileName}
                    className={`w-full h-auto ${isAssigned ? 'opacity-70' : ''}`}
                  />
                  
                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                    <div className="truncate">{image.fileName}</div>
                    <div className="flex justify-between">
                      <span>{image.scaledWidth}×{image.scaledHeight}</span>
                      {isAssigned && (
                        <span className="bg-green-500 px-1 rounded">Grid {gridPosition}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button 
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(image.fileName);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Selected Image Details */}
      {selectedImage && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <h3 className="font-bold mb-1">Selected Image Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>File Name:</div>
            <div className="truncate">{selectedImage.fileName}</div>
            
            <div>Original:</div>
            <div>{selectedImage.originalWidth}×{selectedImage.originalHeight}</div>
            
            <div>Cropped:</div>
            <div>{selectedImage.croppedWidth}×{selectedImage.croppedHeight}</div>
            
            <div>X-Axis:</div>
            <div>{(selectedImage.percentages.xAxis * 100).toFixed(1)}%</div>
            
            <div>Y-Axis:</div>
            <div>{(selectedImage.percentages.yAxis * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThumbnailsPanel;