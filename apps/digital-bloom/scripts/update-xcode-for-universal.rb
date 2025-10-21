#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

app_target = project.targets.find { |t| t.name == 'App' }
watch_target = project.targets.find { |t| t.name == 'Digital Bloom Watch Watch App' }

if app_target
  app_target.build_configurations.each do |config|
    puts "Updating #{config.name} (App) for universal XCFramework..."

    config.build_settings.delete('ARCHS')

    config.build_settings['OTHER_LDFLAGS'] = ['$(inherited)']
    config.build_settings['OTHER_LDFLAGS[sdk=iphoneos*]'] = [
      '-ldigital_bloom_ffi',
      '-L$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/ios-arm64'
    ]
    config.build_settings['OTHER_LDFLAGS[sdk=iphonesimulator*]'] = [
      '-ldigital_bloom_ffi_sim',
      '-L$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/ios-arm64_x86_64-simulator'
    ]

    config.build_settings['HEADER_SEARCH_PATHS'] = ['$(inherited)']
    config.build_settings['HEADER_SEARCH_PATHS[sdk=iphoneos*]'] = [
      '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/ios-arm64/Headers'
    ]
    config.build_settings['HEADER_SEARCH_PATHS[sdk=iphonesimulator*]'] = [
      '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/ios-arm64_x86_64-simulator/Headers'
    ]

    config.build_settings['LIBRARY_SEARCH_PATHS'] = ['$(inherited)']
    config.build_settings['LIBRARY_SEARCH_PATHS[sdk=iphoneos*]'] = [
      '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/ios-arm64'
    ]
    config.build_settings['LIBRARY_SEARCH_PATHS[sdk=iphonesimulator*]'] = [
      '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/ios-arm64_x86_64-simulator'
    ]
  end
else
  puts "❌ Could not find App target"
  exit 1
end

if watch_target
  watch_target.build_configurations.each do |config|
    puts "Updating #{config.name} for universal XCFramework..."
    
    # Remove forced arm64-only architecture so Xcode picks the slice it needs
    config.build_settings.delete('ARCHS')

    # Always inherit default flags first
    config.build_settings['OTHER_LDFLAGS'] = ['$(inherited)']

    # Device builds link against the arm64/arm64_32 slice
    config.build_settings['OTHER_LDFLAGS[sdk=watchos*]'] = [
      '-ldigital_bloom_ffi_device',
      '-L$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/watchos-arm64_arm64_32'
    ]

    # Simulator builds must link the simulator archive instead
    config.build_settings['OTHER_LDFLAGS[sdk=watchsimulator*]'] = [
      '-ldigital_bloom_ffi_sim',
      '-L$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/watchos-arm64_x86_64-simulator'
    ]

    # Ensure headers resolve for both environments
    config.build_settings['HEADER_SEARCH_PATHS'] = ['$(inherited)']
    config.build_settings['HEADER_SEARCH_PATHS[sdk=watchos*]'] = [
      '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/watchos-arm64_arm64_32/Headers'
    ]
    config.build_settings['HEADER_SEARCH_PATHS[sdk=watchsimulator*]'] = [
      '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/watchos-arm64_x86_64-simulator/Headers'
    ]

    # Set deployment target to watchOS 9.0 (supports both architectures)
    config.build_settings['WATCHOS_DEPLOYMENT_TARGET'] = '9.0'
    
    puts "  ✅ Linker path: watchos-arm64_arm64_32"
    puts "  ✅ Deployment target: watchOS 9.0"
    puts "  ✅ Architecture: Auto-select (arm64_32 for Series 4-8, arm64 for Series 9+)"
  end
  
  project.save
  puts "\n🎉 Xcode project updated for universal watchOS support!"
  puts "   Series 4-8: Will use arm64_32 slice"
  puts "   Series 9+:  Will use arm64 slice"
else
  puts "❌ Could not find Watch app target"
  exit 1
end
