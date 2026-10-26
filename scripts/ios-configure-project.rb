#!/usr/bin/env ruby
# frozen_string_literal: true

# Idempotent Xcode project setup for multi-environment builds.
#   bundle exec ruby scripts/ios-configure-project.rb
#
# Creates build configurations <Debug|Release>-<Env>, a base xcconfig per
# configuration, and one shared scheme per environment. Re-run after renaming
# the app or adding an environment, then `npm run pods`.
require 'fileutils'
require 'xcodeproj'

APP = 'Baseline'
ENVIRONMENTS = { 'Dev' => 'development', 'QA' => 'qa', 'Staging' => 'staging', 'Prod' => 'production' }.freeze
IOS_DIR = File.expand_path('../ios', __dir__)
CONFIG_DIR = File.join(IOS_DIR, 'Config')

project = Xcodeproj::Project.open(File.join(IOS_DIR, "#{APP}.xcodeproj"))
app_target = project.targets.find { |t| t.name == APP } or abort("target #{APP} not found")
FileUtils.mkdir_p(CONFIG_DIR)

config_group = project.main_group.find_subpath('Config', true)
config_group.set_source_tree('<group>')
config_group.set_path('Config')

# Settings that must come from xcconfig, not the target (target settings win).
XCCONFIG_OWNED = %w[PRODUCT_BUNDLE_IDENTIFIER MARKETING_VERSION CURRENT_PROJECT_VERSION].freeze

def copy_configuration(list, source_name, new_name, project)
  return list.build_configurations.find { |c| c.name == new_name } if list.build_configurations.any? { |c| c.name == new_name }

  source = list.build_configurations.find { |c| c.name == source_name } or abort("#{source_name} missing")
  config = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
  config.name = new_name
  config.build_settings = Marshal.load(Marshal.dump(source.build_settings))
  list.build_configurations << config
  config
end

ENVIRONMENTS.each do |env, env_file|
  %w[Debug Release].each do |type|
    name = "#{type}-#{env}"
    pods_xcconfig = "../Pods/Target Support Files/Pods-#{APP}/Pods-#{APP}.#{name.downcase}.xcconfig"
    xcconfig_path = File.join(CONFIG_DIR, "#{name}.xcconfig")
    # Xcode only applies its implicit `DEBUG` Swift condition to a configuration
    # literally named "Debug", so `#if DEBUG` needs it set explicitly here.
    debug_flags = type == 'Debug' ? "SWIFT_ACTIVE_COMPILATION_CONDITIONS = $(inherited) DEBUG\n" : ''
    File.write(xcconfig_path, <<~XCCONFIG)
      // #{name}: #{type} build of the #{env_file} environment.
      // Managed by scripts/ios-configure-project.rb.
      #include? "#{pods_xcconfig}"
      #include "Generated/#{env_file}.xcconfig"
      #include "Shared.xcconfig"
      #{debug_flags}
    XCCONFIG

    copy_configuration(project.build_configuration_list, type, name, project)
    target_config = copy_configuration(app_target.build_configuration_list, type, name, project)
    XCCONFIG_OWNED.each { |key| target_config.build_settings.delete(key) }
    file_ref = config_group.files.find { |f| f.path == "#{name}.xcconfig" } || config_group.new_file("#{name}.xcconfig")
    target_config.base_configuration_reference = file_ref
  end
end

File.write(File.join(CONFIG_DIR, 'Shared.xcconfig'), <<~XCCONFIG)
  // Settings shared by every configuration. Managed by scripts/ios-configure-project.rb.
  PRODUCT_BUNDLE_IDENTIFIER = com.postexplorer$(APP_ID_SUFFIX)
  // CI overrides with the build number: xcodebuild CURRENT_PROJECT_VERSION=$BUILD_NUMBER
  CURRENT_PROJECT_VERSION = 1
XCCONFIG
config_group.new_file('Shared.xcconfig') unless config_group.files.any? { |f| f.path == 'Shared.xcconfig' }

# Drop the template's plain Debug/Release so nothing builds without an environment.
[project.build_configuration_list, app_target.build_configuration_list].each do |list|
  list.build_configurations.delete_if { |c| %w[Debug Release].include?(c.name) }
  list.default_configuration_name = 'Release-Prod'
end

# Sentry: wrap the JS bundle phase (source maps) and add a dSYM upload phase.
# Both are skipped unless SENTRY_AUTH_TOKEN is set, so the template builds
# without a Sentry account.
SENTRY_GUARD = 'export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-$([ -z "$SENTRY_AUTH_TOKEN" ] && echo true || echo false)}"'
bundle_phase = app_target.shell_script_build_phases.find { |p| p.name == 'Bundle React Native code and images' }
bundle_phase.always_out_of_date = '1'
bundle_phase.shell_script = <<~SH
  set -e
  #{SENTRY_GUARD}
  WITH_ENVIRONMENT="$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"
  REACT_NATIVE_XCODE="$REACT_NATIVE_PATH/scripts/react-native-xcode.sh"
  SENTRY_XCODE="../node_modules/@sentry/react-native/scripts/sentry-xcode.sh"

  /bin/sh -c "\\"$WITH_ENVIRONMENT\\" \\"$SENTRY_XCODE\\" \\"$REACT_NATIVE_XCODE\\""
SH

unless app_target.shell_script_build_phases.any? { |p| p.name == 'Upload Debug Symbols to Sentry' }
  phase = app_target.new_shell_script_build_phase('Upload Debug Symbols to Sentry')
  phase.always_out_of_date = '1'
  phase.shell_script = <<~SH
    #{SENTRY_GUARD}
    /bin/sh ../node_modules/@sentry/react-native/scripts/sentry-xcode-debug-files.sh
  SH
end

# UIScene lifecycle (mandatory with the iOS 27 SDK): ensure SceneDelegate.swift is compiled.
app_group = project.main_group.find_subpath(APP, false)
app_target.source_build_phase.files.select { |bf| bf.file_ref&.path == 'SceneDelegate.swift' }.each do |bf|
  ref = bf.file_ref
  app_target.source_build_phase.remove_build_file(bf)
  ref.remove_from_project
end
unless app_target.source_build_phase.files_references.any? { |f| f.path == "#{APP}/SceneDelegate.swift" }
  # Template groups store paths relative to ios/ (e.g. "Baseline/AppDelegate.swift").
  ref = app_group.files.find { |f| f.path == "#{APP}/SceneDelegate.swift" } || app_group.new_file("#{APP}/SceneDelegate.swift")
  app_target.add_file_references([ref])
end

project.save

# One shared scheme per environment: Run/Test use Debug, Profile/Archive use Release.
schemes_dir = Xcodeproj::XCScheme.shared_data_dir(project.path)
FileUtils.rm_f(File.join(schemes_dir, "#{APP}.xcscheme"))
ENVIRONMENTS.each_key do |env|
  scheme = Xcodeproj::XCScheme.new
  scheme.configure_with_targets(app_target, nil, launch_target: true)
  scheme.launch_action.build_configuration = "Debug-#{env}"
  scheme.test_action.build_configuration = "Debug-#{env}"
  scheme.analyze_action.build_configuration = "Debug-#{env}"
  scheme.profile_action.build_configuration = "Release-#{env}"
  scheme.archive_action.build_configuration = "Release-#{env}"
  scheme.save_as(project.path, "#{APP}-#{env}", true)
end

puts "Configured #{ENVIRONMENTS.size * 2} build configurations and #{ENVIRONMENTS.size} schemes."
