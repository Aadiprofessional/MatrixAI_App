#!/bin/bash

echo "Fixing Xcode permissions issues..."

# Fix DerivedData permissions
echo "Fixing DerivedData permissions..."
DERIVED_DATA_PATH=~/Library/Developer/Xcode/DerivedData
if [ -d "$DERIVED_DATA_PATH" ]; then
  sudo chmod -R 755 "$DERIVED_DATA_PATH"
  sudo chown -R $(whoami) "$DERIVED_DATA_PATH"
  echo "DerivedData permissions fixed."
else
  echo "DerivedData directory not found."
fi

# Fix ModuleCache permissions
echo "Fixing ModuleCache permissions..."
MODULE_CACHE_PATH=~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex
if [ -d "$MODULE_CACHE_PATH" ]; then
  sudo chmod -R 755 "$MODULE_CACHE_PATH"
  sudo chown -R $(whoami) "$MODULE_CACHE_PATH"
  echo "ModuleCache permissions fixed."
else
  echo "ModuleCache directory not found."
fi

# Fix SDKStatCaches permissions
echo "Fixing SDKStatCaches permissions..."
SDK_STAT_CACHE_PATH=~/Library/Developer/Xcode/DerivedData/SDKStatCaches.noindex
if [ -d "$SDK_STAT_CACHE_PATH" ]; then
  sudo chmod -R 755 "$SDK_STAT_CACHE_PATH"
  sudo chown -R $(whoami) "$SDK_STAT_CACHE_PATH"
  echo "SDKStatCaches permissions fixed."
else
  echo "SDKStatCaches directory not found."
fi

# Fix project directory permissions
echo "Fixing project directory permissions..."
PROJECT_DIR=$(pwd)
sudo chmod -R 755 "$PROJECT_DIR"
sudo chown -R $(whoami) "$PROJECT_DIR"
echo "Project directory permissions fixed."

echo "All permissions fixed. Try building the project again." 