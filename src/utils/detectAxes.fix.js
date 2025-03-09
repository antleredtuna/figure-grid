// Function to more accurately detect axes on cropped images
export function improveAxisDetection(axesResult, bounds, originalWidth, originalHeight, scaledWidth, scaledHeight) {
  if (!axesResult || !axesResult.percentages || !bounds) {
    return axesResult;
  }
  
  // Calculate scale factors from original to scaled
  const scaleX = scaledWidth / originalWidth;
  const scaleY = scaledHeight / originalHeight;
  
  // Calculate the cropped area's boundaries in the scaled image
  const croppedX = bounds.x * scaleX;
  const croppedY = bounds.y * scaleY;
  const croppedWidth = bounds.width * scaleX;
  const croppedHeight = bounds.height * scaleY;
  
  // Calculate percentages relative to the cropped area, not the full image
  const xAxisPercentage = axesResult.percentages.xAxis;
  const yAxisPercentage = axesResult.percentages.yAxis;
  
  // Adjust x-axis coordinates (typically horizontal line)
  if (axesResult.xAxisCoords && axesResult.xAxisCoords.length >= 4) {
    // Calculate position relative to cropped height
    const relativeY = croppedY + (croppedHeight * xAxisPercentage);
    
    axesResult.xAxisCoords = [
      croppedX,
      relativeY,
      croppedX + croppedWidth,
      relativeY
    ];
  }
  
  // Adjust y-axis coordinates (typically vertical line)
  if (axesResult.yAxisCoords && axesResult.yAxisCoords.length >= 4) {
    // Calculate position relative to cropped width
    const relativeX = croppedX + (croppedWidth * yAxisPercentage);
    
    axesResult.yAxisCoords = [
      relativeX,
      croppedY,
      relativeX,
      croppedY + croppedHeight
    ];
  }
  
  return axesResult;
}

// Now add this to the processImageForGrid function
// Find the export async function processImageForGrid definition
// and add this code at the end of the promise resolution:

/*
// After detecting axes but before resolving the promise, improve axis detection:
const improvedAxesResult = improveAxisDetection(
  axesResult,
  bounds,
  img.width,
  img.height,
  scaledCanvas.width,
  scaledCanvas.height
);

// Use the improved result instead
axesResult = improvedAxesResult;
*/
