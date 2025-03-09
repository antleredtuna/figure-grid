// Browser-compatible version of create-grid.js
export async function createImageGrid(images) {
  const cellWidth = 500; // Standard width for a cell
  const columnData = { 1: { images: [] }, 2: { images: [] } };
  const rowData = { 1: { images: [] }, 2: { images: [] } };
  const logger = createLogger();

  logger.header("CREATE IMAGE GRID PROCESS STARTING");
  logger.step("Step 1: Initial image processing and scaling to cellWidth=500");

  // Process all images first - Get image dimensions
  const imageSizes = await getImageSizes(images);

  // FIRST PASS: Column-based calculations
  logger.subHeader("FIRST PASS: Column Processing");

  // Assign images to columns and initialize data
  await processImagesIntoColumns(
    images,
    imageSizes,
    columnData,
    cellWidth,
    logger,
  );

  // Calculate max yAxisPx for each column
  findMaxValuesForColumns(columnData, logger);

  // Calculate xCoOrdinate and requiredPx
  calculateColumnCoordinates(columnData, cellWidth, logger);

  // Apply scaling factors before second pass
  applyScalingFactors(columnData, logger);

  // SECOND PASS: Row-based calculations
  logger.subHeader("SECOND PASS: Row Processing");
  calculateRowAxisValues(columnData, rowData, logger);

  // Calculate max xAxisPxAbove and xAxisPxBelow for each row
  findMaxValuesForRows(rowData, logger);

  // Calculate row offsets
  calculateRowOffsets(rowData, logger);

  // Calculate final positions
  logger.subHeader("Calculating Final Positions");
  const allImages = [...columnData[1].images, ...columnData[2].images];

  // Load all images
  await loadAllImages(allImages);

  // Calculate final positions
  const positions = calculateFinalPositions(allImages, rowData, logger);

  // Create and return canvas with the final grid
  const result = createCanvas(positions, logger);

  logger.header("CREATE IMAGE GRID PROCESS COMPLETE");

  return result;
}

// Helper function to create a logger with formatted output
function createLogger() {
  return {
    header: (text) => console.log(`\n======= ${text} =======`),
    subHeader: (text) => console.log(`\n===== ${text} =====`),
    step: (text) => console.log(text),
    info: (text) => console.log(text),
    imageInfo: (id, text) => console.log(`  Image ${id}: ${text}`),
    columnInfo: (col, text) => console.log(`  Column ${col}: ${text}`),
    rowInfo: (row, text) => console.log(`  Row ${row}: ${text}`),
    indented: (text) => console.log(`    ${text}`),
  };
}

// Get dimensions for all images
async function getImageSizes(images) {
  const imageSizes = {};

  for (const [id, imageData] of Object.entries(images)) {
    try {
      if (imageData.width && imageData.height) {
        imageSizes[id] = {
          width: imageData.width,
          height: imageData.height,
        };
      } else {
        await new Promise((resolve, reject) => {
          const img = document.createElement("img");
          img.onload = () => {
            imageSizes[id] = {
              width: img.width,
              height: img.height,
            };
            resolve();
          };
          img.onerror = () => reject(new Error(`Failed to load image ${id}`));
          img.src = imageData.url;
        });
      }
    } catch (error) {
      console.error(`Error reading metadata for image ${id}:`, error);
      throw error;
    }
  }

  return imageSizes;
}

// Process images into columns
async function processImagesIntoColumns(
  images,
  imageSizes,
  columnData,
  cellWidth,
  logger,
) {
  for (const [id, imageData] of Object.entries(images)) {
    // Determine column and row
    const actualId = parseInt(id);
    const colNum = actualId % 2 === 0 ? 2 : 1; // Even IDs go to column 2, odd to column 1
    const rowNum = actualId <= 2 ? 1 : 2; // IDs 1-2 go to row 1, IDs 3-4 go to row 2

    // Scale image to max dimension of 500px
    const originalWidth = imageSizes[id].width;
    const originalHeight = imageSizes[id].height;
    const scaleFactor = cellWidth / Math.max(originalWidth, originalHeight);
    const width = Math.round(originalWidth * scaleFactor);
    const height = Math.round(originalHeight * scaleFactor);

    // Calculate yAxisPx = yAxis% * imgWidth
    const yAxisPx = imageData.yAxisPercent * width;

    // Store image data
    const image = {
      id: actualId,
      colNum,
      rowNum,
      width,
      height,
      yAxisPercent: imageData.yAxisPercent,
      xAxisPercent: imageData.xAxisPercent,
      yAxisPx,
      scaleFactor,
      url: imageData.url,
      element: null, // Will store the image element later
    };

    columnData[colNum].images.push(image);

    logger.imageInfo(actualId, `position (${rowNum},${colNum}):`);
    logger.indented(`Initial dimensions: ${width}x${height}`);
    logger.indented(
      `yAxis%: ${imageData.yAxisPercent}, yAxisPx: ${yAxisPx.toFixed(2)}`,
    );
  }
}

// Find maximum values for columns
function findMaxValuesForColumns(columnData, logger) {
  logger.info("\nFinding maximum yAxisPx for each column:");

  for (const colNum of [1, 2]) {
    const images = columnData[colNum].images;
    let maxYAxisPx = 0;
    let maxYAxisImage = null;

    for (const image of images) {
      if (image.yAxisPx > maxYAxisPx) {
        maxYAxisPx = image.yAxisPx;
        maxYAxisImage = image.id;
      }
    }

    columnData[colNum].maxYAxisPx = maxYAxisPx;
    columnData[colNum].maxYAxisImage = maxYAxisImage;

    logger.columnInfo(
      colNum,
      `max yAxisPx = ${maxYAxisPx.toFixed(2)} (from Image ${maxYAxisImage})`,
    );
  }
}

// Calculate coordinates for columns
function calculateColumnCoordinates(columnData, cellWidth, logger) {
  logger.info("\nCalculating xCoordinates and requiredPx:");

  for (const colNum of [1, 2]) {
    const columnOffset = cellWidth * (colNum - 1);
    logger.columnInfo(colNum, `offset: ${columnOffset}`);

    // Track max requiredPx for the column
    let maxRequiredPx = 0;

    for (const image of columnData[colNum].images) {
      // Calculate xCoOrdinate
      const yAxisDiff = columnData[colNum].maxYAxisPx - image.yAxisPx;
      image.xCoOrdinate = columnOffset + yAxisDiff;

      // requiredPx calculation - based on the spreadsheet formula: 500 - yAxisPx
      image.requiredPx = cellWidth - image.yAxisPx;

      // Track maximum requiredPx
      if (image.requiredPx > maxRequiredPx) {
        maxRequiredPx = image.requiredPx;
      }

      logger.imageInfo(
        image.id,
        `xCoOrdinate = ${columnOffset} + ${yAxisDiff.toFixed(2)} = ${image.xCoOrdinate.toFixed(2)}`,
      );
      logger.indented(
        `requiredPx = ${cellWidth} - ${image.yAxisPx.toFixed(2)} = ${image.requiredPx.toFixed(2)}`,
      );
    }

    // Store max requiredPx for the column
    columnData[colNum].maxRequiredPx = maxRequiredPx;
    logger.columnInfo(colNum, `max requiredPx = ${maxRequiredPx.toFixed(2)}`);
  }
}

// Apply scaling factors to images
function applyScalingFactors(columnData, logger) {
  logger.info("\n===== Applying scaling factors before second pass =====");

  for (const colNum of [1, 2]) {
    // Find the image with max yAxisPx in this column
    const maxYAxisImage = columnData[colNum].images.find(
      (img) => img.id === columnData[colNum].maxYAxisImage,
    );

    // Get the requiredPx of the max yAxisPx image (this is our reference)
    const referenceRequiredPx = maxYAxisImage.requiredPx;

    for (const image of columnData[colNum].images) {
      if (image.id === columnData[colNum].maxYAxisImage) {
        // This image has the max yAxisPx for the column - no scaling needed
        image.scaleFactor = 1.0;
        image.scaledWidth = image.width;
        image.scaledHeight = image.height;
        logger.imageInfo(
          image.id,
          `No scaling needed (max yAxisPx for column ${colNum})`,
        );
      } else {
        // Scale down using the formula: requiredPx(max yAxisPx image) / requiredPx(current image)
        const scaleDown = referenceRequiredPx / image.requiredPx;
        image.scaleFactor = scaleDown;

        // Apply scaling to width and height
        image.scaledWidth = Math.round(image.width * scaleDown);
        image.scaledHeight = Math.round(image.height * scaleDown);

        logger.imageInfo(
          image.id,
          `Scale factor = ${scaleDown.toFixed(4)} (${referenceRequiredPx.toFixed(2)} / ${image.requiredPx.toFixed(2)})`,
        );
        logger.indented(
          `Scaled dimensions: ${image.scaledWidth}x${image.scaledHeight}`,
        );
      }
    }
  }
}

// Calculate axis values for rows
function calculateRowAxisValues(columnData, rowData, logger) {
  const allImages = [...columnData[1].images, ...columnData[2].images];

  for (const image of allImages) {
    const { id, rowNum, scaledHeight, xAxisPercent } = image;

    // Calculate xAxis values using the scaled height
    const xAxisPxAbove = xAxisPercent * scaledHeight;
    const xAxisPxBelow = scaledHeight - xAxisPxAbove;

    // Store in row data
    image.xAxisPxAbove = xAxisPxAbove;
    image.xAxisPxBelow = xAxisPxBelow;

    rowData[rowNum].images.push(image);

    logger.imageInfo(id, `(row ${rowNum}):`);
    logger.indented(
      `xAxis%: ${xAxisPercent}, xAxisPxAbove: ${xAxisPxAbove.toFixed(2)}, xAxisPxBelow: ${xAxisPxBelow.toFixed(2)}`,
    );
  }
}

// Find maximum values for rows
function findMaxValuesForRows(rowData, logger) {
  logger.info("\nFinding maximum xAxisPxAbove and xAxisPxBelow for each row:");

  for (const rowNum of [1, 2]) {
    let maxXAxisPxAbove = 0;
    let maxXAxisPxBelow = 0;
    let maxAboveImage = null;
    let maxBelowImage = null;

    for (const image of rowData[rowNum].images) {
      if (image.xAxisPxAbove > maxXAxisPxAbove) {
        maxXAxisPxAbove = image.xAxisPxAbove;
        maxAboveImage = image.id;
      }
      if (image.xAxisPxBelow > maxXAxisPxBelow) {
        maxXAxisPxBelow = image.xAxisPxBelow;
        maxBelowImage = image.id;
      }
    }

    rowData[rowNum].maxXAxisPxAbove = maxXAxisPxAbove;
    rowData[rowNum].maxXAxisPxBelow = maxXAxisPxBelow;
    rowData[rowNum].rowHeight = maxXAxisPxAbove + maxXAxisPxBelow;

    logger.rowInfo(rowNum, "");
    logger.indented(
      `maxXAxisPxAbove: ${maxXAxisPxAbove.toFixed(2)} (from Image ${maxAboveImage})`,
    );
    logger.indented(
      `maxXAxisPxBelow: ${maxXAxisPxBelow.toFixed(2)} (from Image ${maxBelowImage})`,
    );
    logger.indented(`rowHeight: ${rowData[rowNum].rowHeight.toFixed(2)}`);
  }
}

// Calculate row offsets
function calculateRowOffsets(rowData, logger) {
  logger.info("\nCalculating row offsets:");

  rowData[1].rowOffset = 0;
  rowData[2].rowOffset = rowData[1].rowHeight;

  logger.rowInfo(1, `offset: ${rowData[1].rowOffset}`);
  logger.rowInfo(2, `offset: ${rowData[2].rowOffset}`);
}

// Load all images
async function loadAllImages(images) {
  await Promise.all(
    images.map(async (image) => {
      return new Promise((resolve, reject) => {
        const img = document.createElement("img");
        img.onload = () => {
          image.element = img;
          resolve();
        };
        img.onerror = () =>
          reject(new Error(`Failed to load image ${image.id}`));
        img.src = image.url;
      });
    }),
  );
}

// Calculate final positions for all images
function calculateFinalPositions(images, rowData, logger) {
  const positions = {};

  for (const image of images) {
    // Calculate vertical offset based on difference between max and actual xAxisPxAbove
    const yOffset = rowData[image.rowNum].maxXAxisPxAbove - image.xAxisPxAbove;
    const yCoOrdinate = rowData[image.rowNum].rowOffset + yOffset;

    // Store final position
    positions[image.id] = {
      x: image.xCoOrdinate,
      y: Math.round(yCoOrdinate),
      width: image.scaledWidth,
      height: image.scaledHeight,
      yAxisPercent: image.yAxisPercent,
      xAxisPercent: image.xAxisPercent,
      url: image.url,
      element: image.element,
    };

    logger.imageInfo(image.id, "");
    logger.indented(
      `Final position: (${positions[image.id].x.toFixed(2)}, ${positions[image.id].y})`,
    );
    logger.indented(
      `Final dimensions: ${positions[image.id].width}x${positions[image.id].height}`,
    );
  }

  return positions;
}

// Create canvas and draw final grid
function createCanvas(positions, logger) {
  // Calculate canvas dimensions
  let canvasWidth = 0;
  let canvasHeight = 0;

  for (const pos of Object.values(positions)) {
    canvasWidth = Math.max(canvasWidth, pos.x + pos.width);
    canvasHeight = Math.max(canvasHeight, pos.y + pos.height);
  }

  logger.info(`\nFinal canvas dimensions: ${canvasWidth}x${canvasHeight}`);

  // Create canvas and draw the final grid
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  // Fill with white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw each image at its calculated position
  for (const pos of Object.values(positions)) {
    if (pos.element) {
      ctx.drawImage(pos.element, pos.x, pos.y, pos.width, pos.height);
    }
  }

  return {
    canvas,
    width: canvasWidth,
    height: canvasHeight,
    positions,
    dataUrl: canvas.toDataURL(),
  };
}
