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

    // Drag gesture state
    private var lastDragLocation: CGPoint?
    private var lastDragTime: Date = Date()
    private let minDragDistance: CGFloat = 8.0 // Minimum distance between particle spawns
    private let dragThrottleInterval: TimeInterval = 0.05 // 50ms between spawns (20 per second)

    init() {
        startAnimationLoop()
    }

    deinit {
        stopAnimationLoop()
    }

    func handleDrag(at location: CGPoint, in size: CGSize) {
        let now = Date()

        // Throttle based on time
        guard now.timeIntervalSince(lastDragTime) >= dragThrottleInterval else {
            return
        }

        // Throttle based on distance
        if let lastLocation = lastDragLocation {
            let dx = location.x - lastLocation.x
            let dy = location.y - lastLocation.y
            let distance = sqrt(dx * dx + dy * dy)

            guard distance >= minDragDistance else {
                return
            }
        }

        // Create particles at drag location
        let particleCount = currentMode == .vine ? 2 : 15 // Fewer particles for vine to prevent lag
        engine.createParticles(mode: currentMode, at: location, count: particleCount, size: 6.0)

        lastDragLocation = location
        lastDragTime = now
    }

    func handleDragEnd() {
        lastDragLocation = nil
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

        // Fetch particles for rendering
        let newParticles = engine.getParticles(maxParticles: 500)
        DispatchQueue.main.async {
            self.particles = newParticles
            self.particleCount = newParticles.count
        }
    }
}
