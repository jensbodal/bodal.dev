//
//  ParticleCanvasView.swift
//  Digital Bloom Watch App
//
//  Canvas view for rendering particles efficiently
//

import SwiftUI

struct ParticleCanvasView: View {
    let particles: [DigitalBloomEngine.Particle]

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0/30.0)) { timeline in
            Canvas { context, size in
                for particle in particles {
                    let center = CGPoint(x: particle.x, y: particle.y)
                    let radius = particle.size / 2.0

                    // Create particle color with opacity based on life
                    let color = Color(
                        red: Double(particle.color.r) / 255.0,
                        green: Double(particle.color.g) / 255.0,
                        blue: Double(particle.color.b) / 255.0
                    ).opacity(particle.opacity)

                    // Draw particle as circle
                    let rect = CGRect(
                        x: center.x - radius,
                        y: center.y - radius,
                        width: particle.size,
                        height: particle.size
                    )

                    context.fill(
                        Circle().path(in: rect),
                        with: .color(color)
                    )

                    // Add glow effect for larger particles
                    if particle.size > 6.0 {
                        context.fill(
                            Circle().path(in: rect.insetBy(dx: -1, dy: -1)),
                            with: .color(color.opacity(particle.opacity * 0.3))
                        )
                    }
                }
            }
        }
    }
}

#Preview {
    ParticleCanvasView(particles: [
        DigitalBloomEngine.Particle(x: 100, y: 100, size: 10, life: 1.0, color: (255, 105, 180)),
        DigitalBloomEngine.Particle(x: 120, y: 80, size: 8, life: 0.8, color: (0, 255, 255)),
        DigitalBloomEngine.Particle(x: 80, y: 120, size: 12, life: 0.6, color: (127, 255, 0))
    ])
    .frame(width: 200, height: 200)
    .background(Color.black)
}
