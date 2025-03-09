#!/bin/bash

# Navigate to the iOS directory
cd ios

# Find the hermes framework directory
HERMES_FRAMEWORK_DIR=$(find ~/Library/Developer/Xcode/DerivedData -name "hermes.framework" -type d | grep -i "XCFrameworkIntermediates" | head -n 1)

if [ -z "$HERMES_FRAMEWORK_DIR" ]; then
  echo "Hermes framework directory not found"
  exit 1
fi

echo "Found Hermes framework at: $HERMES_FRAMEWORK_DIR"

# Fix permissions
echo "Fixing permissions..."
sudo chmod -R 755 "$HERMES_FRAMEWORK_DIR"
sudo chown -R $(whoami) "$HERMES_FRAMEWORK_DIR"

echo "Permissions fixed. Try building again." 