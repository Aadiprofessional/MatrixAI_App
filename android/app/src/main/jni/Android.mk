LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

# Don't include react-native-svg in the build
REACT_NATIVE_SVG_EXCLUDE := true

# Include the React Native Makefile
include $(REACT_NATIVE_DIR)/ReactAndroid/src/main/jni/react/Android.mk 