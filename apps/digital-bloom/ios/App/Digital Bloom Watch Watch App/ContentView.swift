//
//  ContentView.swift
//  Digital Bloom Watch App
//
//  Main particle animation view with Digital Crown mode selection
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = ParticleViewModel()

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Black background
                Color.black.ignoresSafeArea()

                // Particle canvas
                ParticleCanvasView(particles: viewModel.particles)
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                viewModel.handleDrag(at: value.location, in: geometry.size)
                            }
                            .onEnded { _ in
                                viewModel.handleDragEnd()
                            }
                    )

                // Mode indicator overlay (top)
                VStack {
                    Text(viewModel.currentMode.name)
                        .font(.caption2)
                        .foregroundColor(.white)
                        .padding(4)
                        .background(Color.black.opacity(0.6))
                        .cornerRadius(4)

                    Spacer()

                    // Particle count indicator (bottom)
                    Text("\(viewModel.particleCount) particles")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.5))
                        .padding(4)
                }
                .padding(8)
                .allowsHitTesting(false) // Allow touches to pass through to canvas
            }
            .focusable()
            .digitalCrownRotation(
                $viewModel.crownRotation,
                from: 0.0,
                through: Double(DigitalBloomEngine.AnimationMode.allCases.count),
                by: 1.0,
                sensitivity: .medium,
                isContinuous: false,
                isHapticFeedbackEnabled: true
            )
        }
        .ignoresSafeArea()
    }
}

#Preview {
    ContentView()
}
