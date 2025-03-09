// Browser-compatible version of detectAxes.js
// This file should be saved as src/utils/detectAxes.js
export async function detectAxes(
  imageElement,
  darknessThreshold = 110,
  xAxisSearchStart = 0.7,
  yAxisSearchEnd = 0.15,
  minAxisLength = 0.4,
  // New parameters
  maxGapTolerance = 5, // Maximum allowed gap in pixels
  minContinuityRatio = 0.7, // Minimum ratio of dark pixels in the line
  checkThickness = true, // Whether to check for consistent line thickness
  thicknessRange = 3, // Range to check for thickness
) {
  try {
    // Get dimensions from image element
    const width = imageElement.width;
    const height = imageElement.height;

    // Create canvas with same dimensions as the image
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(imageElement, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Process image to find potential axis pixels
    const edgeMap = new Uint8Array(width * height);

    // Simple edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Check if pixel is dark (likely axis)
        if (
          r < darknessThreshold &&
          g < darknessThreshold &&
          b < darknessThreshold
        ) {
          edgeMap[y * width + x] = 1;
        }
      }
    }

    // Find horizontal lines (potential x-axis) with improved continuity checking
    let horizontalLines = [];

    for (let y = Math.floor(height * xAxisSearchStart); y < height; y++) {
      // Track continuous segments
      let segments = [];
      let currentSegment = null;

      for (let x = 0; x < width; x++) {
        if (edgeMap[y * width + x]) {
          // Start a new segment or extend current one
          if (currentSegment === null) {
            currentSegment = { start: x, end: x };
          } else {
            currentSegment.end = x;
          }
        } else if (currentSegment !== null) {
          // End of a segment
          segments.push(currentSegment);
          currentSegment = null;
        }
      }

      // Don't forget the last segment if it extends to the edge
      if (currentSegment !== null) {
        segments.push(currentSegment);
      }

      // Merge segments that are close together (within gap tolerance)
      let mergedSegments = [];
      if (segments.length > 0) {
        let currentMergedSegment = { ...segments[0] };

        for (let i = 1; i < segments.length; i++) {
          if (segments[i].start - currentMergedSegment.end <= maxGapTolerance) {
            // Merge with current segment
            currentMergedSegment.end = segments[i].end;
          } else {
            // Start a new merged segment
            mergedSegments.push(currentMergedSegment);
            currentMergedSegment = { ...segments[i] };
          }
        }

        // Don't forget the last merged segment
        mergedSegments.push(currentMergedSegment);
      }

      // Check each merged segment for qualification
      for (const segment of mergedSegments) {
        const length = segment.end - segment.start + 1;

        if (length > width * minAxisLength) {
          // Calculate continuity
          let darkPixelCount = 0;

          for (let x = segment.start; x <= segment.end; x++) {
            if (edgeMap[y * width + x]) {
              darkPixelCount++;
            }
          }

          const continuityRatio = darkPixelCount / length;

          if (continuityRatio >= minContinuityRatio) {
            // Check thickness consistency if requested
            let thicknessScore = 1.0;

            if (checkThickness) {
              let neighboringDarkPixels = 0;
              let totalNeighboringPixels = 0;

              // Check rows above and below
              for (let dy = -thicknessRange; dy <= thicknessRange; dy++) {
                if (dy === 0) continue; // Skip the current row

                const ny = y + dy;
                if (ny < 0 || ny >= height) continue;

                for (let x = segment.start; x <= segment.end; x++) {
                  totalNeighboringPixels++;
                  if (edgeMap[ny * width + x]) {
                    neighboringDarkPixels++;
                  }
                }
              }

              // Thickness consistency score (want it to be low for true axes)
              if (totalNeighboringPixels > 0) {
                thicknessScore = neighboringDarkPixels / totalNeighboringPixels;
              }
            }

            // Calculate final score - favors long, continuous lines with consistent thickness
            // For axes, we want high continuity but relatively low thickness score
            const finalScore =
              continuityRatio * (2.0 - thicknessScore) * length;

            horizontalLines.push({
              y,
              x1: segment.start,
              x2: segment.end,
              length,
              continuityRatio,
              thicknessScore,
              finalScore,
            });
          }
        }
      }
    }

    // Sort horizontal lines by final score
    horizontalLines.sort((a, b) => b.finalScore - a.finalScore);

    // Find vertical lines (potential y-axis) with improved continuity checking
    let verticalLines = [];

    for (let x = 0; x < Math.floor(width * yAxisSearchEnd); x++) {
      // Track continuous segments
      let segments = [];
      let currentSegment = null;

      for (let y = 0; y < height; y++) {
        if (edgeMap[y * width + x]) {
          // Start a new segment or extend current one
          if (currentSegment === null) {
            currentSegment = { start: y, end: y };
          } else {
            currentSegment.end = y;
          }
        } else if (currentSegment !== null) {
          // End of a segment
          segments.push(currentSegment);
          currentSegment = null;
        }
      }

      // Don't forget the last segment if it extends to the edge
      if (currentSegment !== null) {
        segments.push(currentSegment);
      }

      // Merge segments that are close together (within gap tolerance)
      let mergedSegments = [];
      if (segments.length > 0) {
        let currentMergedSegment = { ...segments[0] };

        for (let i = 1; i < segments.length; i++) {
          if (segments[i].start - currentMergedSegment.end <= maxGapTolerance) {
            // Merge with current segment
            currentMergedSegment.end = segments[i].end;
          } else {
            // Start a new merged segment
            mergedSegments.push(currentMergedSegment);
            currentMergedSegment = { ...segments[i] };
          }
        }

        // Don't forget the last merged segment
        mergedSegments.push(currentMergedSegment);
      }

      // Check each merged segment for qualification
      for (const segment of mergedSegments) {
        const length = segment.end - segment.start + 1;

        if (length > height * minAxisLength) {
          // Calculate continuity
          let darkPixelCount = 0;

          for (let y = segment.start; y <= segment.end; y++) {
            if (edgeMap[y * width + x]) {
              darkPixelCount++;
            }
          }

          const continuityRatio = darkPixelCount / length;

          if (continuityRatio >= minContinuityRatio) {
            // Check thickness consistency if requested
            let thicknessScore = 1.0;

            if (checkThickness) {
              let neighboringDarkPixels = 0;
              let totalNeighboringPixels = 0;

              // Check columns to the left and right
              for (let dx = -thicknessRange; dx <= thicknessRange; dx++) {
                if (dx === 0) continue; // Skip the current column

                const nx = x + dx;
                if (nx < 0 || nx >= width) continue;

                for (let y = segment.start; y <= segment.end; y++) {
                  totalNeighboringPixels++;
                  if (edgeMap[y * width + nx]) {
                    neighboringDarkPixels++;
                  }
                }
              }

              // Thickness consistency score (want it to be low for true axes)
              if (totalNeighboringPixels > 0) {
                thicknessScore = neighboringDarkPixels / totalNeighboringPixels;
              }
            }

            // Calculate final score
            const finalScore =
              continuityRatio * (2.0 - thicknessScore) * length;

            verticalLines.push({
              x,
              y1: segment.start,
              y2: segment.end,
              length,
              continuityRatio,
              thicknessScore,
              finalScore,
            });
          }
        }
      }
    }

    // Sort vertical lines by final score
    verticalLines.sort((a, b) => b.finalScore - a.finalScore);

    // Get best lines
    const bestXAxis = horizontalLines.length > 0 ? horizontalLines[0] : null;
    const bestYAxis = verticalLines.length > 0 ? verticalLines[0] : null;

    // Create a visualization canvas with the detected axes
    const visCanvas = document.createElement("canvas");
    visCanvas.width = width;
    visCanvas.height = height;
    const visCtx = visCanvas.getContext("2d");
    visCtx.drawImage(imageElement, 0, 0);

    // Draw detected axis lines
    if (bestXAxis) {
      visCtx.beginPath();
      visCtx.strokeStyle = "red";
      visCtx.lineWidth = 2;
      visCtx.moveTo(bestXAxis.x1, bestXAxis.y);
      visCtx.lineTo(bestXAxis.x2, bestXAxis.y);
      visCtx.stroke();
    }

    if (bestYAxis) {
      visCtx.beginPath();
      visCtx.strokeStyle = "blue";
      visCtx.lineWidth = 2;
      visCtx.moveTo(bestYAxis.x, bestYAxis.y1);
      visCtx.lineTo(bestYAxis.x, bestYAxis.y2);
      visCtx.stroke();
    }

    // Return the results including percentages needed for grid creation
    return {
      visualizationCanvas: visCanvas,
      xAxisCoords: bestXAxis
        ? [bestXAxis.x1, bestXAxis.y, bestXAxis.x2, bestXAxis.y]
        : [],
      yAxisCoords: bestYAxis
        ? [bestYAxis.x, bestYAxis.y1, bestYAxis.x, bestYAxis.y2]
        : [],
      xAxisDetails: bestXAxis
        ? {
            length: bestXAxis.length,
            continuityRatio: bestXAxis.continuityRatio,
            thicknessScore: bestXAxis.thicknessScore,
            finalScore: bestXAxis.finalScore,
          }
        : null,
      yAxisDetails: bestYAxis
        ? {
            length: bestYAxis.length,
            continuityRatio: bestYAxis.continuityRatio,
            thicknessScore: bestYAxis.thicknessScore,
            finalScore: bestYAxis.finalScore,
          }
        : null,
      dimensions: { width, height },
      percentages:
        bestXAxis && bestYAxis
          ? {
              xAxis: bestXAxis.y / height, // Y-coord of x-axis as percentage of height
              yAxis: bestYAxis.x / width, // X-coord of y-axis as percentage of width
            }
          : null,
    };
  } catch (error) {
    console.error(`Error processing image:`, error);
    throw error;
  }
}

// Function to crop whitespace from an image
export async function cropWhitespace(imageElement, threshold = 245) {
  const canvas = document.createElement("canvas");
  const width = imageElement.width;
  const height = imageElement.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(imageElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Find the bounds
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Check if pixel is non-white (using threshold)
      if (
        data[idx] < threshold ||
        data[idx + 1] < threshold ||
        data[idx + 2] < threshold
      ) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // Add some padding
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  // Check if we found any non-white pixels
  if (minX >= maxX || minY >= maxY) {
    return { canvas: canvas, bounds: { x: 0, y: 0, width, height } };
  }

  // Create a new canvas with the cropped image
  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;

  const croppedCtx = croppedCanvas.getContext("2d");
  const croppedImageData = ctx.getImageData(
    minX,
    minY,
    croppedWidth,
    croppedHeight,
  );
  croppedCtx.putImageData(croppedImageData, 0, 0);

  return {
    canvas: croppedCanvas,
    bounds: { x: minX, y: minY, width: croppedWidth, height: croppedHeight },
  };
}

// Function to scale an image to a specific width while maintaining aspect ratio
export function scaleImage(imageElement, targetWidth = 500) {
  const canvas = document.createElement("canvas");
  const aspectRatio = imageElement.width / imageElement.height;
  const newWidth = targetWidth;
  const newHeight = Math.round(targetWidth / aspectRatio);

  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(imageElement, 0, 0, newWidth, newHeight);

  return {
    canvas,
    width: newWidth,
    height: newHeight,
  };
}

export async function processImageForGrid(file, settings) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        // Convert original image to data URL immediately
        const originalCanvas = document.createElement("canvas");
        originalCanvas.width = img.width;
        originalCanvas.height = img.height;
        const originalCtx = originalCanvas.getContext("2d", { willReadFrequently: true });
        originalCtx.drawImage(img, 0, 0);
        const originalDataUrl = originalCanvas.toDataURL();
        
        // Now we can safely revoke the blob URL
        URL.revokeObjectURL(url);

        // Step 1: Crop whitespace
        const { canvas: croppedCanvas, bounds } = await cropWhitespace(
          img,
          settings.whitespaceThreshold,
        );

        // Step 2: Scale to target width
        const croppedImg = new Image();
        croppedImg.onload = async () => {
          try {
            const { canvas: scaledCanvas } = scaleImage(
              croppedImg,
              settings.cellWidth,
            );

            // Step 3: Detect axes
            const scaledImg = document.createElement("img");
            scaledImg.onload = async () => {
              try {
                const axesResult = await detectAxes(
                  scaledImg,
                  settings.darknessThreshold,
                  settings.xAxisSearchStart,
                  settings.yAxisSearchEnd,
                  settings.minAxisLength,
                  settings.maxGapTolerance,
                  settings.minContinuityRatio,
                  settings.checkThickness,
                  settings.thicknessRange,
                );

                // Create blob URLs
                const croppedUrl = croppedCanvas.toDataURL();
                const scaledUrl = scaledCanvas.toDataURL();
                const visualizationUrl =
                  axesResult.visualizationCanvas.toDataURL();

                resolve({
                  file,
                  fileName: file.name,
                  originalWidth: img.width,
                  originalHeight: img.height,
                  croppedWidth: croppedCanvas.width,
                  croppedHeight: croppedCanvas.height,
                  scaledWidth: scaledCanvas.width,
                  scaledHeight: scaledCanvas.height,
                  bounds,
                  originalUrl: originalDataUrl, // Use data URL instead of blob URL
                  croppedUrl,
                  scaledUrl,
                  visualizationUrl,
                  xAxisCoords: axesResult.xAxisCoords,
                  yAxisCoords: axesResult.yAxisCoords,
                  xAxisDetails: axesResult.xAxisDetails,
                  yAxisDetails: axesResult.yAxisDetails,
                  percentages: axesResult.percentages || {
                    xAxis: 0.5, // Default to center if not detected
                    yAxis: 0.15, // Default to 15% from left if not detected
                  },
                });
              } catch (error) {
                reject(error);
              }
            };
            scaledImg.src = scaledCanvas.toDataURL();
          } catch (error) {
            reject(error);
          }
        };
        croppedImg.src = croppedCanvas.toDataURL();
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
}// Function to more accurately detect axes on cropped images
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
