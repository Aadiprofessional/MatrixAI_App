#!/bin/bash

# Set environment variable to disable new architecture
export RCT_NEW_ARCH_ENABLED=0

# Navigate to iOS directory
cd ios

# Define variables
WORKSPACE="MatrixAI.xcworkspace"
SCHEME="MatrixAI"
CONFIGURATION="Release"
ARCHIVE_PATH="./build/MatrixAI.xcarchive"

# Check if workspace exists
if [ ! -d "$WORKSPACE" ]; then
  echo "Error: Workspace $WORKSPACE not found!"
  exit 1
fi

# Create build directory if it doesn't exist
mkdir -p ./build

# Fix permissions for Hermes framework
echo "Fixing permissions for Hermes framework..."
if [ -d "Pods/hermes-engine/destroot/Library/Frameworks/universal" ]; then
  chmod -R 755 Pods/hermes-engine/destroot/Library/Frameworks/universal
fi

# Fix Xcode DerivedData permissions
echo "Fixing Xcode DerivedData permissions..."
if [ -d ~/Library/Developer/Xcode/DerivedData ]; then
  chmod -R 755 ~/Library/Developer/Xcode/DerivedData
fi

# Build archive
echo "Building archive..."
xcodebuild -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -archivePath "$ARCHIVE_PATH" \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates \
  HEADER_SEARCH_PATHS="$(inherited) ${PODS_ROOT}/Headers/Public/Yoga ${PODS_ROOT}/Headers/Public/React-Core" \
  GCC_PREPROCESSOR_DEFINITIONS="$(inherited) RCT_NEW_ARCH_ENABLED=0" \
  archive

# Check if archive was successful
if [ -d "$ARCHIVE_PATH" ]; then
  echo "Archive created successfully at $ARCHIVE_PATH"
  echo "You can now export the IPA using Xcode's Organizer or using xcodebuild -exportArchive"
else
  echo "Archive failed. Check the logs for errors."
  exit 1
fi 