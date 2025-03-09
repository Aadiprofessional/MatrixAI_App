#!/bin/bash

echo "=== Fixing RNSVG build issues ==="

# Navigate to the RNSVG directory
RNSVG_DIR="node_modules/react-native-svg"
if [ ! -d "$RNSVG_DIR" ]; then
  echo "Error: RNSVG directory not found at $RNSVG_DIR"
  exit 1
fi

echo "Found RNSVG at $RNSVG_DIR"

# Modify RNSVG files to ensure RCT_NEW_ARCH_ENABLED is consistently set to 0
find "$RNSVG_DIR" -name "*.h" -o -name "*.mm" -o -name "*.m" | while read -r file; do
  echo "Processing $file"
  # Replace any existing RCT_NEW_ARCH_ENABLED definitions with 0
  sed -i '' 's/#define RCT_NEW_ARCH_ENABLED 1/#define RCT_NEW_ARCH_ENABLED 0/g' "$file"
done

# Clean the build directory
echo "=== Cleaning build artifacts ==="
rm -rf ios/build
rm -rf ios/Pods/RNSVG

# Reinstall pods
echo "=== Reinstalling pods ==="
cd ios
pod install
cd ..

echo "=== RNSVG fix completed ==="
echo "Now try running the archive script again with:"
echo "./ios_archive.sh" 