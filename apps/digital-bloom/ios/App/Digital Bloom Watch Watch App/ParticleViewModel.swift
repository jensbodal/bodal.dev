//
//  ParticleViewModel.swift
//  Digital Bloom Watch App
//
//  View model managing particle physics and user interaction
//

import SwiftUI
import Combine

class ParticleViewModel: ObservableObject {
    @Published var particles: [DigitalBloomEngine.Particle] = []
    @Published var currentMode: DigitalBloomEngine.AnimationMode = .vine
    @Published var particleCount: Int = 0
    @Published var crownRotation: Double = 0.0 {
        didSet {
            // Map crown rotation to mode index
            let modeIndex = Int(crownRotation.rounded()) % DigitalBloomEngine.AnimationMode.allCases.count
            currentMode = DigitalBloomEngine.AnimationMode.allCases[modeIndex]
        }
    }

    private let engine = DigitalBloomEngine()
    private var displayLink: Timer?
    private let targetFPS: Double = 30.0 // Battery-friendly frame rate

    // Spatial awareness for vine spawning
    private var lastSpawnLocation: CGPoint?
    private var lastDragLocation: CGPoint?
    private var lastDragTime: Date = Date()

    // Distance-based spawning: larger distance = visual breathing room
    // 30 pixels on 200x200 screen = 15% of width (prevents clutter)
    private var minSpawnDistance: CGFloat {
        return currentMode == .vine ? 30.0 : 12.0
    }

    init() {
        startAnimationLoop()
    }

    deinit {
        stopAnimationLoop()
    }

    func handleDrag(at location: CGPoint, in size: CGSize) {
        let now = Date()

        // Check if this is the first touch (tap or start of drag)
        let isFirstTouch = lastDragLocation == nil

        // Calculate velocity to detect intentional movement
        var velocity: CGFloat = 0
        if let lastLocation = lastDragLocation {
            let dx = location.x - lastLocation.x
            let dy = location.y - lastLocation.y
            let distance = sqrt(dx * dx + dy * dy)
            let timeDelta = now.timeIntervalSince(lastDragTime)
            velocity = timeDelta > 0 ? CGFloat(distance / timeDelta) : 0
        }

        lastDragLocation = location
        lastDragTime = now

        // For first touch (tap), always spawn
        // For subsequent touches (drag), check velocity and distance
        if !isFirstTouch {
            // Require movement for drag spawning
            if velocity < 50 {
                return
            }

            // Distance-based spawning for drags only
            // This creates natural feeling - fast swipes spawn more, slow movements spawn fewer
            if let lastSpawn = lastSpawnLocation {
                let dx = location.x - lastSpawn.x
                let dy = location.y - lastSpawn.y
                let distance = sqrt(dx * dx + dy * dy)

                guard distance >= minSpawnDistance else { return }
            }
        }

        // For taps (isFirstTouch = true), we spawn immediately with no distance check
        // This allows unlimited rapid tapping anywhere on screen

        // Create particles at drag location
        // Vine mode: Just 1 vine per point (spatial awareness prevents clutter)
        // Other modes: 15 particles per point
        let particleCount = currentMode == .vine ? 1 : 15
        engine.createParticles(mode: currentMode, at: location, count: particleCount, size: 6.0)

        lastSpawnLocation = location
    }

    func handleDragEnd() {
        lastDragLocation = nil
        lastSpawnLocation = nil
    }

    private func startAnimationLoop() {
        let interval = 1.0 / targetFPS
        displayLink = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            self?.updateFrame()
        }
    }

    private func stopAnimationLoop() {
        displayLink?.invalidate()
        displayLink = nil
    }

    private func updateFrame() {
        // Get screen dimensions (approximate for Apple Watch)
        let width: Double = 200.0
        let height: Double = 200.0

        // Update physics
        engine.update(width: width, height: height)

        // Fetch particles for rendering (reduced to 5000 for better performance)
        // No async dispatch - we're already on main thread via Timer
        // Async was causing queue backlog and delayed vine rendering
        let newParticles = engine.getParticles(maxParticles: 5000)
        self.particles = newParticles
        self.particleCount = newParticles.count
    }
}
