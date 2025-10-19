#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

watch_target = project.targets.find { |t| t.name == 'Digital Bloom Watch Watch App' }

if watch_target
  watch_target.build_configurations.each do |config|
    puts "Updating #{config.name} for universal XCFramework..."
    
    # Remove forced arm64-only architecture
    # Let Xcode automatically select the right architecture from the fat binary
    config.build_settings.delete('ARCHS')
    
    # Update linker search path to use correct XCFramework structure
    # The new XCFramework uses "watchos-arm64_arm64_32" for device
    config.build_settings['OTHER_LDFLAGS'] = [
      '-ldigital_bloom_ffi_device',
      '-L$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/watchos-arm64_arm64_32'
    ]
    
    # Update header search paths
    config.build_settings['HEADER_SEARCH_PATHS'] = [
      '$(inherited)',
      '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/watchos-arm64_arm64_32/Headers'
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
