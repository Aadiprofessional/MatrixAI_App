#!/bin/bash

echo "=== Cleaning iOS build artifacts ==="
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock
rm -rf MatrixAI.xcworkspace
rm -rf ~/Library/Developer/Xcode/DerivedData/MatrixAI-*

echo "=== Fixing RNSVG issues ==="
cd ..
RNSVG_DIR="node_modules/react-native-svg"
if [ -d "$RNSVG_DIR" ]; then
  echo "Found RNSVG at $RNSVG_DIR"
  # Modify RNSVG files to ensure RCT_NEW_ARCH_ENABLED is consistently set to 0
  find "$RNSVG_DIR" -name "*.h" -o -name "*.mm" -o -name "*.m" | while read -r file; do
    echo "Processing $file"
    sed -i '' 's/#define RCT_NEW_ARCH_ENABLED 1/#define RCT_NEW_ARCH_ENABLED 0/g' "$file"
  done
  echo "RNSVG files updated."
else
  echo "RNSVG directory not found. Skipping RNSVG fixes."
fi

echo "=== Installing pods ==="
cd ios
export RCT_NEW_ARCH_ENABLED=0
pod install

echo "=== Fixing Hermes framework permissions ==="
HERMES_FRAMEWORK_DIR=$(find ~/Library/Developer/Xcode/DerivedData -name "hermes.framework" -type d | grep -i "XCFrameworkIntermediates" | head -n 1)
if [ -n "$HERMES_FRAMEWORK_DIR" ]; then
  echo "Found Hermes framework at: $HERMES_FRAMEWORK_DIR"
  sudo chmod -R 755 "$HERMES_FRAMEWORK_DIR"
  sudo chown -R $(whoami) "$HERMES_FRAMEWORK_DIR"
  echo "Permissions fixed."
else
  echo "Hermes framework not found yet. Will continue with build."
fi

echo "=== Fixing Xcode DerivedData permissions ==="
DERIVED_DATA_PATH=~/Library/Developer/Xcode/DerivedData
if [ -d "$DERIVED_DATA_PATH" ]; then
  sudo chmod -R 755 "$DERIVED_DATA_PATH"
  sudo chown -R $(whoami) "$DERIVED_DATA_PATH"
  echo "DerivedData permissions fixed."
fi

echo "=== Building for device ==="
xcodebuild -workspace MatrixAI.xcworkspace -scheme MatrixAI -configuration Release -sdk iphoneos -allowProvisioningUpdates clean build HEADER_SEARCH_PATHS='$(inherited) ${PODS_ROOT}/Headers/Public/Yoga ${PODS_ROOT}/Headers/Public/React-Core'

cd ..

echo "=== Cleaning React Native caches ==="
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*

echo "=== Build completed ==="
echo "If the build was successful, you can now create an archive using:"
echo "./ios_archive.sh" 