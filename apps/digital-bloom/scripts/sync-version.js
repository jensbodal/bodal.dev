#!/usr/bin/env node

/**
 * Syncs version from package.json to iOS Xcode project
 * Updates MARKETING_VERSION in project.pbxproj
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');
const XCODE_PROJECT_PATH = join(ROOT_DIR, 'ios/App/App.xcodeproj/project.pbxproj');

try {
    // Read package.json version
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const version = packageJson.version;

    if (!version) {
        console.error('❌ No version found in package.json');
        process.exit(1);
    }

    console.log(`📦 Package version: ${version}`);

    // Read Xcode project file
    let projectContent = readFileSync(XCODE_PROJECT_PATH, 'utf8');

    // Update MARKETING_VERSION (matches both Debug and Release configurations)
    const marketingVersionRegex = /(MARKETING_VERSION = )[\d.]+;/g;
    const matches = projectContent.match(marketingVersionRegex);

    if (!matches || matches.length === 0) {
        console.error('❌ Could not find MARKETING_VERSION in project.pbxproj');
        process.exit(1);
    }

    // Replace all occurrences of MARKETING_VERSION
    projectContent = projectContent.replace(
        marketingVersionRegex,
        `$1${version};`
    );

    // Update CURRENT_PROJECT_VERSION (build number)
    // Extract build number from version (e.g., "1.2.3" -> build "3")
    const versionParts = version.split('.');
    const buildNumber = versionParts.length >= 3 ? versionParts[2] : '1';

    const currentProjectVersionRegex = /(CURRENT_PROJECT_VERSION = )\d+;/g;
    const buildMatches = projectContent.match(currentProjectVersionRegex);

    if (!buildMatches || buildMatches.length === 0) {
        console.error('❌ Could not find CURRENT_PROJECT_VERSION in project.pbxproj');
        process.exit(1);
    }

    // Replace all occurrences of CURRENT_PROJECT_VERSION
    projectContent = projectContent.replace(
        currentProjectVersionRegex,
        `$1${buildNumber};`
    );

    // Write updated project file
    writeFileSync(XCODE_PROJECT_PATH, projectContent, 'utf8');

    console.log(`✅ Updated Xcode MARKETING_VERSION to ${version}`);
    console.log(`✅ Updated Xcode CURRENT_PROJECT_VERSION (build number) to ${buildNumber}`);
    console.log(`📱 Updated ${matches.length} configuration(s) in project.pbxproj`);
} catch (error) {
    console.error('❌ Error syncing version:', error.message);
    process.exit(1);
}
