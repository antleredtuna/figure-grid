#!/bin/bash

# Create a backup of the original file
cp App.jsx App.jsx.backup

# Use sed to remove the duplicate canvasRef declaration (around line 35)
sed -i '/^  \/\/ Ref for the canvas to generate the final image$/{N;N;d;}' App.jsx

echo "Fixed App.jsx by removing the duplicate canvasRef declaration."
echo "A backup was created as App.jsx.backup"
