// Main App Component
import React, { useState, useRef, useEffect } from 'react';
import { Folder, Image as ImageIcon, Grid, Download, Settings } from 'lucide-react';
import './App.css';

function App() {
  // State for grid configuration
  const [config, setConfig] = useState({
    rows: 2,
    columns: 2,
    totalWidth: 1200,
    totalHeight: 800,
    horizontalPadding: 10,
    verticalPadding: 10,
    backgroundColor: 'transparent'
  });
  
  // State for image files in file explorer
  const [imageFiles, setImageFiles] = useState([]);
  
  // State for the grid cells
  const [gridCells, setGridCells] = useState([]);
  
  // Ref for the canvas to generate the final image
  const canvasRef = useRef(null);
  
  // State for active tab ('preview' or 'settings')
  const [activeTab, setActiveTab] = useState('preview');
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    // Create URL objects for the images
    const newImageFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      file
    }));
    
    setImageFiles(prev => [...prev, ...newImageFiles]);
  };
  
  // Handle changes to grid configuration
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    
    // For numerical values, parse to integer, otherwise use string value (for backgroundColor)
    const newValue = name === 'backgroundColor' ? value : parseInt(value, 10);
    setConfig(prev => ({ ...prev, [name]: newValue }));
    
    // Reset grid cells when configuration changes
    if (name === 'rows' || name === 'columns') {
      initializeGridCells(name === 'rows' ? parseInt(value, 10) : config.rows, 
                         name === 'columns' ? parseInt(value, 10) : config.columns);
    }
  };
  
  // Initialize grid cells based on rows and columns
  const initializeGridCells = (rows, columns) => {
    const cells = [];
    for (let i = 0; i < rows * columns; i++) {
      cells.push({ id: i, imageId: null });
    }
    setGridCells(cells);
  };
  
  // Reset all grid cells
  const resetGrid = () => {
    initializeGridCells(config.rows, config.columns);
  };
  
  // Handle drag start from file explorer
  const handleDragStart = (e, imageId) => {
    e.dataTransfer.setData('imageId', imageId);
  };
  
  // Handle drag over grid cell
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Handle drop on grid cell
  const handleDrop = (e, cellId) => {
    e.preventDefault();
    const imageId = e.dataTransfer.getData('imageId');
    
    setGridCells(prev => 
      prev.map(cell => 
        cell.id === cellId ? { ...cell, imageId } : cell
      )
    );
  };
  
  // Generate the final composite image
  const generateImage = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = config.totalWidth;
    canvas.height = config.totalHeight;
    
    // Clear the canvas and apply background color
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply background color if not transparent
    if (config.backgroundColor !== 'transparent') {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Calculate available space for cells (accounting for padding)
    const totalHorizontalPadding = config.horizontalPadding * (config.columns - 1);
    const totalVerticalPadding = config.verticalPadding * (config.rows - 1);
    
    // Calculate cell dimensions (accounting for padding)
    const cellWidth = (config.totalWidth - totalHorizontalPadding) / config.columns;
    const cellHeight = (config.totalHeight - totalVerticalPadding) / config.rows;
    
    // Draw each cell
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.columns; col++) {
        const cellIndex = row * config.columns + col;
        const cell = gridCells[cellIndex];
        
        // Calculate cell position (accounting for padding)
        const cellX = col * (cellWidth + config.horizontalPadding);
        const cellY = row * (cellHeight + config.verticalPadding);
        
        if (cell && cell.imageId) {
          const imageFile = imageFiles.find(img => img.id === cell.imageId);
          if (imageFile) {
            // Create an image element and draw it on the canvas
            const img = new window.Image();
            img.src = imageFile.url;
            
            // Wait for the image to load
            await new Promise((resolve) => {
              img.onload = resolve;
            });
            
            // Draw the image to fit the cell (cover)
            const imgRatio = img.width / img.height;
            const cellRatio = cellWidth / cellHeight;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (imgRatio > cellRatio) {
              // Image is wider than cell
              drawHeight = cellHeight;
              drawWidth = drawHeight * imgRatio;
              offsetX = (cellWidth - drawWidth) / 2;
              offsetY = 0;
            } else {
              // Image is taller than cell
              drawWidth = cellWidth;
              drawHeight = drawWidth / imgRatio;
              offsetX = 0;
              offsetY = (cellHeight - drawHeight) / 2;
            }
            
            ctx.drawImage(
              img,
              cellX + offsetX,
              cellY + offsetY,
              drawWidth,
              drawHeight
            );
          }
        }
      }
    }
    
    // Convert canvas to downloadable image
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'image-grid.png';
    link.href = dataUrl;
    link.click();
  };
  
  // Handle double click on grid cell to remove image
  const handleDoubleClick = (cellId) => {
    setGridCells(prev => 
      prev.map(cell => 
        cell.id === cellId ? { ...cell, imageId: null } : cell
      )
    );
  };
  
  // Initialize grid cells on component mount
  useEffect(() => {
    initializeGridCells(config.rows, config.columns);
  }, []);
  
  // Toggle between tabs
  const toggleTab = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="app-container">
      <h1>Image Grid Creator</h1>
      
      <div className="main-content">
        {/* Left Pane - File Explorer */}
        <div className="file-explorer">
          <h2><Folder size={20} /> Image Files</h2>
          <div className="file-upload">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              id="file-input"
            />
            <label htmlFor="file-input">Choose Images</label>
          </div>
          
          <div className="thumbnails">
            {imageFiles.map(image => (
              <div
                key={image.id}
                className="thumbnail"
                draggable
                onDragStart={(e) => handleDragStart(e, image.id)}
              >
                <img src={image.url} alt={image.name} />
                <span className="filename">{image.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Pane - Grid Editor with Tabs */}
        <div className="grid-editor">
          {/* Tabs Navigation */}
          <div className="tabs-navigation">
            <button 
              className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => toggleTab('preview')}
            >
              <Grid size={16} /> Grid Preview
            </button>
            <button 
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => toggleTab('settings')}
            >
              <Settings size={16} /> Settings
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="tab-content">
            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="preview-tab">
                <div className="grid-container">
                  <div 
                    className="grid-display"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
                      gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                      gap: `${config.verticalPadding}px ${config.horizontalPadding}px`,
                      aspectRatio: `${config.totalWidth} / ${config.totalHeight}`
                    }}
                  >
                    {gridCells.map(cell => (
                      <div
                        key={cell.id}
                        className="grid-cell"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, cell.id)}
                        onDoubleClick={() => handleDoubleClick(cell.id)}
                      >
                        {cell.imageId ? (
                          <img 
                            src={imageFiles.find(img => img.id === cell.imageId)?.url} 
                            alt="Cell content" 
                          />
                        ) : (
                          <div className="empty-cell">
                            <ImageIcon size={24} />
                            <span>Drop image here</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button onClick={generateImage} className="generate-button">
                  <Download size={20} />
                  Generate Image
                </button>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="settings-tab">
                <div className="settings-grid">
                  <div className="setting-group">
                    <label htmlFor="rows">Rows:</label>
                    <input
                      type="number"
                      id="rows"
                      name="rows"
                      min="1"
                      max="10"
                      value={config.rows}
                      onChange={handleConfigChange}
                    />
                  </div>
                  
                  <div className="setting-group">
                    <label htmlFor="columns">Columns:</label>
                    <input
                      type="number"
                      id="columns"
                      name="columns"
                      min="1"
                      max="10"
                      value={config.columns}
                      onChange={handleConfigChange}
                    />
                  </div>
                  
                  <div className="setting-group">
                    <label htmlFor="totalWidth">Width (px):</label>
                    <input
                      type="number"
                      id="totalWidth"
                      name="totalWidth"
                      min="200"
                      max="5000"
                      value={config.totalWidth}
                      onChange={handleConfigChange}
                    />
                  </div>
                  
                  <div className="setting-group">
                    <label htmlFor="totalHeight">Height (px):</label>
                    <input
                      type="number"
                      id="totalHeight"
                      name="totalHeight"
                      min="200"
                      max="5000"
                      value={config.totalHeight}
                      onChange={handleConfigChange}
                    />
                  </div>
                  
                  <div className="setting-group">
                    <label htmlFor="horizontalPadding">Horizontal Padding (px):</label>
                    <input
                      type="number"
                      id="horizontalPadding"
                      name="horizontalPadding"
                      min="0"
                      max="100"
                      value={config.horizontalPadding}
                      onChange={handleConfigChange}
                    />
                  </div>
                  
                  <div className="setting-group">
                    <label htmlFor="verticalPadding">Vertical Padding (px):</label>
                    <input
                      type="number"
                      id="verticalPadding"
                      name="verticalPadding"
                      min="0"
                      max="100"
                      value={config.verticalPadding}
                      onChange={handleConfigChange}
                    />
                  </div>
                  
                  <div className="setting-group background-setting">
                    <label>Background Color:</label>
                    <div className="color-options">
                      <label className="color-option">
                        <input
                          type="radio"
                          name="backgroundColor"
                          value="transparent"
                          checked={config.backgroundColor === 'transparent'}
                          onChange={handleConfigChange}
                        />
                        Transparent
                      </label>
                      <label className="color-option">
                        <input
                          type="radio"
                          name="backgroundColor"
                          value="white"
                          checked={config.backgroundColor === 'white'}
                          onChange={handleConfigChange}
                        />
                        White
                      </label>
                      <label className="color-option">
                        <input
                          type="radio"
                          name="backgroundColor"
                          value="black"
                          checked={config.backgroundColor === 'black'}
                          onChange={handleConfigChange}
                        />
                        Black
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="settings-actions">
                  <button onClick={resetGrid} className="reset-button">
                    Reset Grid
                  </button>
                  <button 
                    onClick={() => toggleTab('preview')} 
                    className="apply-button"
                  >
                    Apply & Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for generating the final image */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

export default App;