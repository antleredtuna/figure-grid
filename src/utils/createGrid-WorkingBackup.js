// Browser-compatible version of create-grid.js
export async function createImageGrid(images) {
  const cellWidth = 500; // Standard width for a cell
  const columnData = { 1: { images: [] }, 2: { images: [] } };
  const rowData = { 1: { images: [] }, 2: { images: [] } };

  console.log("======= CREATE IMAGE GRID PROCESS STARTING =======");
  console.log("Step 1: Initial image processing and scaling to cellWidth=500");

  // Process all images first
  const imageSizes = {};
  for (const [id, imageData] of Object.entries(images)) {
    try {
      // Get image dimensions
      if (imageData.width && imageData.height) {
        imageSizes[id] = {
          width: imageData.width,
          height: imageData.height,
        };
      } else {
        // If dimensions aren't provided, create an image element to get them
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

  // FIRST PASS: Column-based calculations
  console.log("===== FIRST PASS: Column Processing =====");

  // Correctly assign images to columns
  // IDs 1 and 3 go to column 1, IDs 2 and 4 go to column 2
  for (const [id, imageData] of Object.entries(images)) {
    // Determine column and row
    const actualId = parseInt(id);
    const colNum = actualId % 2 === 0 ? 2 : 1; // Even IDs go to column 2, odd to column 1
    const rowNum = actualId <= 2 ? 1 : 2; // IDs 1-2 go to row 1, IDs 3-4 go to row 2

    // Scale image to max dimension of 500px
    const originalWidth = imageSizes[id].width;
    const originalHeight = imageSizes[id].height;
    const scaleFactor = 500 / Math.max(originalWidth, originalHeight);
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

    console.log(`Image ${actualId} (position ${rowNum},${colNum}):`);
    console.log(`  Initial dimensions: ${width}x${height}`);
    console.log(
      `  yAxis%: ${imageData.yAxisPercent}, yAxisPx: ${yAxisPx.toFixed(2)}`,
    );
  }

  // Calculate max yAxisPx for each column
  console.log("\nFinding maximum yAxisPx for each column:");
  for (const colNum of [1, 2]) {
    let maxYAxisPx = 0;
    let maxYAxisImage = null;

    for (const image of columnData[colNum].images) {
      if (image.yAxisPx > maxYAxisPx) {
        maxYAxisPx = image.yAxisPx;
        maxYAxisImage = image.id;
      }
    }

    columnData[colNum].maxYAxisPx = maxYAxisPx;
    columnData[colNum].maxYAxisImage = maxYAxisImage;

    console.log(
      `  Column ${colNum}: max yAxisPx = ${maxYAxisPx.toFixed(2)} (from Image ${maxYAxisImage})`,
    );
  }

  // Calculate xCoOrdinate and requiredPx
  console.log("\nCalculating xCoordinates and requiredPx:");
  for (const colNum of [1, 2]) {
    const columnOffset = cellWidth * (colNum - 1);
    console.log(`  Column ${colNum} offset: ${columnOffset}`);

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

      console.log(
        `  Image ${image.id}: xCoOrdinate = ${columnOffset} + ${yAxisDiff.toFixed(2)} = ${image.xCoOrdinate.toFixed(2)}`,
      );
      console.log(
        `    requiredPx = ${cellWidth} - ${image.yAxisPx.toFixed(2)} = ${image.requiredPx.toFixed(2)}`,
      );
    }

    // Store max requiredPx for the column
    columnData[colNum].maxRequiredPx = maxRequiredPx;
    console.log(
      `  Column ${colNum}: max requiredPx = ${maxRequiredPx.toFixed(2)}`,
    );
  }

  // Apply scaling factors before second pass
  console.log("\n===== Applying scaling factors before second pass =====");
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
        console.log(
          `  Image ${image.id}: No scaling needed (max yAxisPx for column ${colNum})`,
        );
      } else {
        // Scale down using the formula: requiredPx(max yAxisPx image) / requiredPx(current image)
        const scaleDown = referenceRequiredPx / image.requiredPx;
        image.scaleFactor = scaleDown;

        // Apply scaling to width and height
        image.scaledWidth = Math.round(image.width * scaleDown);
        image.scaledHeight = Math.round(image.height * scaleDown);

        console.log(
          `  Image ${image.id}: Scale factor = ${scaleDown.toFixed(4)} (${referenceRequiredPx.toFixed(2)} / ${image.requiredPx.toFixed(2)})`,
        );
        console.log(
          `    Scaled dimensions: ${image.scaledWidth}x${image.scaledHeight}`,
        );
      }
    }
  }

  // SECOND PASS: Row-based calculations
  console.log("\n===== SECOND PASS: Row Processing =====");
  for (const image of [...columnData[1].images, ...columnData[2].images]) {
    const { rowNum, scaledWidth, scaledHeight, xAxisPercent } = image;

    // Calculate xAxis values using the scaled height
    const xAxisPxAbove = xAxisPercent * scaledHeight;
    const xAxisPxBelow = scaledHeight - xAxisPxAbove;

    // Store in row data
    image.xAxisPxAbove = xAxisPxAbove;
    image.xAxisPxBelow = xAxisPxBelow;

    rowData[rowNum].images.push(image);

    console.log(`  Image ${image.id} (row ${rowNum}):`);
    console.log(
      `    xAxis%: ${xAxisPercent}, xAxisPxAbove: ${xAxisPxAbove.toFixed(2)}, xAxisPxBelow: ${xAxisPxBelow.toFixed(2)}`,
    );
  }

  // Calculate max xAxisPxAbove and xAxisPxBelow for each row
  console.log("\nFinding maximum xAxisPxAbove and xAxisPxBelow for each row:");
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

    console.log(`  Row ${rowNum}:`);
    console.log(
      `    maxXAxisPxAbove: ${maxXAxisPxAbove.toFixed(2)} (from Image ${maxAboveImage})`,
    );
    console.log(
      `    maxXAxisPxBelow: ${maxXAxisPxBelow.toFixed(2)} (from Image ${maxBelowImage})`,
    );
    console.log(`    rowHeight: ${rowData[rowNum].rowHeight.toFixed(2)}`);
  }

  // Calculate rowOffset
  console.log("\nCalculating row offsets:");
  rowData[1].rowOffset = 0;
  rowData[2].rowOffset = rowData[1].rowHeight;
  console.log(`  Row 1 offset: ${rowData[1].rowOffset}`);
  console.log(`  Row 2 offset: ${rowData[2].rowOffset}`);

  // Calculate final positions
  console.log("\n===== Calculating Final Positions =====");
  const positions = {};
  const allImages = [...columnData[1].images, ...columnData[2].images];

  // Load all images
  await Promise.all(
    allImages.map(async (image) => {
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

  // Calculate yCoOrdinate and store final positions
  for (const image of allImages) {
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

    console.log(`  Image ${image.id}:`);
    console.log(
      `    Final position: (${positions[image.id].x.toFixed(2)}, ${positions[image.id].y})`,
    );
    console.log(
      `    Final dimensions: ${positions[image.id].width}x${positions[image.id].height}`,
    );
  }

  // Calculate canvas dimensions
  let canvasWidth = 0;
  let canvasHeight = 0;

  for (const pos of Object.values(positions)) {
    canvasWidth = Math.max(canvasWidth, pos.x + pos.width);
    canvasHeight = Math.max(canvasHeight, pos.y + pos.height);
  }

  console.log(`\nFinal canvas dimensions: ${canvasWidth}x${canvasHeight}`);

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

  console.log("======= CREATE IMAGE GRID PROCESS COMPLETE =======");

  return {
    canvas,
    width: canvasWidth,
    height: canvasHeight,
    positions,
    dataUrl: canvas.toDataURL(),
  };
}
