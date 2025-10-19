#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the iOS App target
app_target = project.targets.find { |t| t.name == 'App' }

if app_target
  puts "✅ Found iOS App target"

  # Add XCFramework to the project if not already added
  frameworks_group = project.main_group.find_subpath('Frameworks', true)
  xcframework_ref = frameworks_group.files.find { |f| f.path == '../Frameworks/DigitalBloomFFI.xcframework' }

  unless xcframework_ref
    puts "📦 Adding XCFramework reference..."
    xcframework_ref = frameworks_group.new_file('../Frameworks/DigitalBloomFFI.xcframework')
  end

  # Add to build phases
  unless app_target.frameworks_build_phase.files.find { |f| f.file_ref == xcframework_ref }
    puts "🔗 Linking XCFramework to target..."
    app_target.frameworks_build_phase.add_file_reference(xcframework_ref)
  end

  app_target.build_configurations.each do |config|
    puts "Configuring #{config.name} for iOS..."

    # Set bridging header path
    config.build_settings['SWIFT_OBJC_BRIDGING_HEADER'] = '$(PROJECT_DIR)/App/DigitalBloom-Bridging-Header.h'

    # Add framework search paths
    config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= ['$(inherited)']
    config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '$(PROJECT_DIR)/../Frameworks'
    config.build_settings['FRAMEWORK_SEARCH_PATHS'].uniq!

    # Add header search paths
    config.build_settings['HEADER_SEARCH_PATHS'] ||= ['$(inherited)']
    config.build_settings['HEADER_SEARCH_PATHS'] << '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/ios-arm64/Headers'
    config.build_settings['HEADER_SEARCH_PATHS'].uniq!

    # Add library search paths
    config.build_settings['LIBRARY_SEARCH_PATHS'] ||= ['$(inherited)']
    config.build_settings['LIBRARY_SEARCH_PATHS'] << '$(PROJECT_DIR)/../Frameworks/DigitalBloomFFI.xcframework/ios-arm64'
    config.build_settings['LIBRARY_SEARCH_PATHS'].uniq!

    # Link against the static library
    config.build_settings['OTHER_LDFLAGS'] ||= ['$(inherited)']
    # Add -ldigital_bloom_ffi if not already present
    unless config.build_settings['OTHER_LDFLAGS'].include?('-ldigital_bloom_ffi')
      config.build_settings['OTHER_LDFLAGS'] << '-ldigital_bloom_ffi'
    end

    puts "  ✅ Bridging header: #{config.build_settings['SWIFT_OBJC_BRIDGING_HEADER']}"
    puts "  ✅ Framework search paths configured"
    puts "  ✅ Header search paths configured"
    puts "  ✅ Linker flags configured"
  end

  project.save
  puts "\n🎉 iOS App configured for Rust FFI!"
  puts "   Bridging header: App/DigitalBloom-Bridging-Header.h"
  puts "   XCFramework: ../Frameworks/DigitalBloomFFI.xcframework"
else
  puts "❌ Could not find iOS App target"
  exit 1
end
