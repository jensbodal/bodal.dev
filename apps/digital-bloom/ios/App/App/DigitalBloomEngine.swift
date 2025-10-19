//
//  DigitalBloomEngine.swift
//  Digital Bloom - Swift Bridge for Rust FFI
//
//  Provides a type-safe Swift interface to the Rust particle physics engine
//

import Foundation

/// Swift wrapper for Rust particle physics engine
public class DigitalBloomEngine {
    private var rustEngine: OpaquePointer?

    /// Animation modes available
    public enum AnimationMode: UInt8 {
        case vine = 0
        case gravity = 1
        case bounce = 2
        case burst = 3
        case lightning = 4
        case constellation = 5
        case vortex = 6

        var name: String {
            switch self {
            case .vine: return "Vine"
            case .gravity: return "Gravity"
            case .bounce: return "Bounce"
            case .burst: return "Burst"
            case .lightning: return "Lightning"
            case .constellation: return "Constellation"
            case .vortex: return "Vortex"
            }
        }
    }

    /// Particle representation for rendering
    public struct Particle {
        public let x: Double
        public let y: Double
        public let size: Double
        public let life: Double
        public let color: (r: UInt8, g: UInt8, b: UInt8)

        public var opacity: Double {
            return life
        }
    }

    public init() {
        rustEngine = digital_bloom_create()
    }

    deinit {
        if let engine = rustEngine {
            digital_bloom_destroy(engine)
        }
    }

    /// Update physics simulation by one frame
    public func update(width: Double, height: Double) {
        guard let engine = rustEngine else { return }
        _ = digital_bloom_update(engine, width, height)
    }

    /// Create particles at specified location with current mode
    public func createParticles(mode: AnimationMode, at point: CGPoint, count: Int = 20, size: Double = 10.0) {
        guard let engine = rustEngine else { return }
        _ = digital_bloom_create_particles(
            engine,
            mode.rawValue,
            Double(point.x),
            Double(point.y),
            UInt(count),
            size
        )
    }

    /// Get current particle count
    public func getParticleCount() -> Int {
        guard let engine = rustEngine else { return 0 }
        return digital_bloom_get_particle_count(engine)
    }

    /// Get all particles for rendering
    public func getParticles(maxParticles: Int = 500) -> [Particle] {
        guard let engine = rustEngine else { return [] }

        var buffer = [CParticle](repeating: CParticle(x: 0, y: 0, size: 0, life: 0, color_r: 0, color_g: 0, color_b: 0), count: maxParticles)

        let count = buffer.withUnsafeMutableBufferPointer { bufferPtr -> Int in
            return digital_bloom_get_particles(engine, bufferPtr.baseAddress, UInt(maxParticles))
        }

        return buffer.prefix(count).map { cParticle in
            Particle(
                x: cParticle.x,
                y: cParticle.y,
                size: cParticle.size,
                life: cParticle.life,
                color: (r: cParticle.color_r, g: cParticle.color_g, b: cParticle.color_b)
            )
        }
    }

    /// Clear all particles and reset simulation
    public func clear() {
        guard let engine = rustEngine else { return }
        digital_bloom_clear(engine)
    }
}
