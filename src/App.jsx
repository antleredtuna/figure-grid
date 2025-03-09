import React, { useState } from "react";
import ThumbnailsPanel from "./components/ThumbnailsPanel";
import ControlPanel from "./components/ControlPanel";
import ReviewProcessing from "./components/ReviewProcessing";
import MainGrid from "./components/MainGrid";

function App() {
  // Default settings
  const [settings, setSettings] = useState({
    cellWidth: 500,
    numRows: 2,
    numColumns: 2,
    whitespaceThreshold: 245,
    darknessThreshold: 110,
    xAxisSearchStart: 0.7,
    yAxisSearchEnd: 0.15,
    minAxisLength: 0.4,
    maxGapTolerance: 5,
    minContinuityRatio: 0.7,
    checkThickness: true,
    thicknessRange: 3,
  });

  // State for processed images
  const [processedImages, setProcessedImages] = useState([]);

  // Selected image for review
  const [selectedImage, setSelectedImage] = useState(null);

  // Grid layout (map of position -> image)
  const [gridLayout, setGridLayout] = useState({});

  // Currently selected cell in the grid
  const [selectedCell, setSelectedCell] = useState(null);

  // Active tab (left panel)
  const [leftTab, setLeftTab] = useState("thumbnails");

  // Active tab (right panel)
  const [rightTab, setRightTab] = useState("review");

  // Grid aligned result
  const [alignedGrid, setAlignedGrid] = useState(null);

  // Update settings
  const handleSettingsChange = (newSettings) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  // Add processed images
  const handleAddImages = (newImages) => {
    setProcessedImages((prevImages) => [...prevImages, ...newImages]);

    // Select the first image if none is selected
    if (!selectedImage && newImages.length > 0) {
      setSelectedImage(newImages[0]);
    }
  };

  // Update a processed image
  const handleUpdateImage = (updatedImage) => {
    setProcessedImages((prevImages) =>
      prevImages.map((img) =>
        img.fileName === updatedImage.fileName ? updatedImage : img,
      ),
    );

    // Update selected image if it's the current one
    if (selectedImage && selectedImage.fileName === updatedImage.fileName) {
      setSelectedImage(updatedImage);
    }

    // Update grid layout if this image is used
    const positionToUpdate = Object.keys(gridLayout).find(
      (pos) =>
        gridLayout[pos] && gridLayout[pos].fileName === updatedImage.fileName,
    );

    if (positionToUpdate) {
      setGridLayout((prevLayout) => ({
        ...prevLayout,
        [positionToUpdate]: updatedImage,
      }));
    }
  };

  // Delete a processed image
  const handleDeleteImage = (fileName) => {
    // Remove from processed images
    setProcessedImages((prevImages) =>
      prevImages.filter((img) => img.fileName !== fileName),
    );

    // Clear selection if it's the selected image
    if (selectedImage && selectedImage.fileName === fileName) {
      const remaining = processedImages.filter(
        (img) => img.fileName !== fileName,
      );
      setSelectedImage(remaining.length > 0 ? remaining[0] : null);
    }

    // Remove from grid layout
    const newLayout = { ...gridLayout };
    Object.keys(newLayout).forEach((pos) => {
      if (newLayout[pos] && newLayout[pos].fileName === fileName) {
        delete newLayout[pos];
      }
    });

    setGridLayout(newLayout);
  };

  // Assign an image to a grid position
  const handleAssignToGrid = (image, position) => {
    setGridLayout((prevLayout) => ({
      ...prevLayout,
      [position]: image,
    }));
  };

  // Remove an image from the grid
  const handleRemoveFromGrid = (position) => {
    const newLayout = { ...gridLayout };
    delete newLayout[position];
    setGridLayout(newLayout);
  };

  // Handle aligned grid result
  const handleAlignedGrid = (result) => {
    setAlignedGrid(result);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel (1/3 of screen) */}
      <div className="w-1/3 h-full flex flex-col border-r border-gray-300">
        {/* Tabs */}
        <div className="flex border-b border-gray-300">
          <button
            className={`flex-1 py-2 px-4 ${leftTab === "thumbnails" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setLeftTab("thumbnails")}
          >
            Thumbnails
          </button>
          <button
            className={`flex-1 py-2 px-4 ${leftTab === "controls" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setLeftTab("controls")}
          >
            Controls
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-auto">
          {leftTab === "thumbnails" ? (
            <ThumbnailsPanel
              images={processedImages}
              selectedImage={selectedImage}
              onSelect={setSelectedImage}
              onDelete={handleDeleteImage}
              onAdd={handleAddImages}
              settings={settings}
              gridLayout={gridLayout}
              selectedCell={rightTab === "grid" ? selectedCell : null}
              onAssignToGrid={handleAssignToGrid}
            />
          ) : (
            <ControlPanel settings={settings} onChange={handleSettingsChange} />
          )}
        </div>
      </div>

      {/* Right Panel (2/3 of screen) */}
      <div className="w-2/3 h-full flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-300">
          <button
            className={`flex-1 py-2 px-4 ${rightTab === "review" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setRightTab("review")}
          >
            Review Processing
          </button>
          <button
            className={`flex-1 py-2 px-4 ${rightTab === "grid" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setRightTab("grid")}
          >
            Main Grid
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-auto">
          {rightTab === "review" ? (
            <ReviewProcessing
              image={selectedImage}
              settings={settings}
              onUpdateImage={handleUpdateImage}
            />
          ) : (
            <MainGrid
              numRows={settings.numRows}
              numColumns={settings.numColumns}
              gridLayout={gridLayout}
              processedImages={processedImages}
              onAssignImage={handleAssignToGrid}
              onRemoveImage={handleRemoveFromGrid}
              onAlignedGrid={handleAlignedGrid}
              alignedGrid={alignedGrid}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
