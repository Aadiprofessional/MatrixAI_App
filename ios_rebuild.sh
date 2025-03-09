#!/bin/bash

# Navigate to the iOS directory
cd ios

# Clean the build folder
rm -rf build
rm -rf Pods
rm -rf Podfile.lock
rm -rf MatrixAI.xcworkspace

# Install pods
pod install

# Go back to the root directory
cd ..

# Clean watchman watches
watchman watch-del-all

# Clean metro bundler cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clean npm cache
npm cache clean --force

# Install dependencies
npm install

# Start the build
npx react-native run-ios --verbose 