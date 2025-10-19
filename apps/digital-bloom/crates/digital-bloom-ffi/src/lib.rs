//! Digital Bloom FFI Layer for watchOS
//! 
//! This crate provides C-compatible FFI bindings for the Digital Bloom particle physics engine.
//! It reuses the existing physics code from the WASM crate and exposes it via C-compatible functions.

#![allow(non_camel_case_types)]

use std::f64::consts::PI;

// Simple random number generator using system time (no dependencies)
fn random() -> f64 {
    // Use a simple LCG-based RNG for native targets
    use std::cell::Cell;
    thread_local! {
        static SEED: Cell<u64> = Cell::new(1);
    }

    SEED.with(|seed| {
        let mut s = seed.get();
        s = s.wrapping_mul(6364136223846793005).wrapping_add(1);
        seed.set(s);
        (s >> 33) as f64 / (1u64 << 31) as f64
    })
}

// Core physics types (simplified from WASM version, no wasm-bindgen)
#[derive(Clone)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

pub struct Particle {
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
    color: String,
    size: f64,
    mode: String,
    life: f64,
    decay: f64,
    origin_x: f64,
    origin_y: f64,
    angle: f64,
    radius: f64,
}

impl Particle {
    pub fn new(x: f64, y: f64, vx: f64, vy: f64, color: String, size: f64, mode: String) -> Self {
        Particle {
            x, y, vx, vy, color, size, mode,
            life: 1.0,
            decay: 0.005,
            origin_x: x,
            origin_y: y,
            angle: 0.0,
            radius: 0.0,
        }
    }

    pub fn new_vortex(x: f64, y: f64, origin_x: f64, origin_y: f64, angle: f64, radius: f64, color: String, size: f64) -> Self {
        let vx = angle.cos() * 2.0;
        let vy = angle.sin() * 2.0;
        Particle {
            x, y, vx, vy, color, size,
            mode: "vortex".to_string(),
            life: 1.0,
            decay: 0.003,
            origin_x, origin_y, angle, radius,
        }
    }

    pub fn update(&mut self, width: f64, height: f64) -> bool {
        if self.mode == "vortex" {
            self.angle += 0.08;
            self.radius -= 0.5;
            if self.radius < 0.0 { self.radius = 0.0; }
            self.x = self.origin_x + self.angle.cos() * self.radius;
            self.y = self.origin_y + self.angle.sin() * self.radius;
        } else {
            self.vx *= 0.99;
            self.vy *= 0.99;
            if self.mode == "gravity" { self.vy += 0.3; }
            self.x += self.vx;
            self.y += self.vy;
            if self.mode == "bounce" {
                let bounce = 0.7;
                if self.x < self.size || self.x > width - self.size {
                    self.vx *= -bounce;
                    self.x = self.x.max(self.size).min(width - self.size);
                }
                if self.y < self.size || self.y > height - self.size {
                    self.vy *= -bounce;
                    self.y = self.y.max(self.size).min(height - self.size);
                }
            }
        }
        self.life -= self.decay;
        self.life > 0.0 && self.x > -50.0 && self.x < width + 50.0 && self.y > -50.0 && self.y < height + 50.0
    }

    pub fn x(&self) -> f64 { self.x }
    pub fn y(&self) -> f64 { self.y }
    pub fn size(&self) -> f64 { self.size }
    pub fn life(&self) -> f64 { self.life }
    pub fn color(&self) -> &str { &self.color }
}

pub struct Vine {
    pub points: Vec<Point>,
    pub x: f64,
    pub y: f64,
    pub angle: f64,
    pub speed: f64,
    pub turn_speed: f64,
    pub max_length: f64,
    pub is_grown: bool,
    pub color: String,
    pub line_width: f64,
}

impl Vine {
    pub fn new(x: f64, y: f64, color: String, size: f64, max_length: f64, min_length: f64) -> Self {
        Vine {
            points: vec![Point { x, y }],
            x, y,
            angle: random() * PI * 2.0,
            speed: random() * 2.0 + 0.5,
            turn_speed: random() * 0.12 - 0.06,
            max_length: random() * max_length + min_length,
            is_grown: false,
            color,
            line_width: (random() * size * 0.5) + (size * 0.5),
        }
    }

    pub fn update(&mut self, width: f64, height: f64) -> bool {
        if self.is_grown { return false; }
        self.angle += self.turn_speed;
        self.x += self.angle.cos() * self.speed;
        self.y += self.angle.sin() * self.speed;
        if self.x < 0.0 || self.x > width || self.y < 0.0 || self.y > height {
            self.is_grown = true;
            return false;
        }
        self.points.push(Point { x: self.x, y: self.y });
        if self.points.len() as f64 > self.max_length {
            self.is_grown = true;
            return false;
        }
        true
    }
}

pub struct Lightning {
    pub segments: Vec<Point>,
    pub branches: Vec<Vec<Point>>,
    pub color: String,
    pub line_width: f64,
    pub life: f64,
    pub decay: f64,
}

impl Lightning {
    pub fn new(start_x: f64, start_y: f64, end_x: f64, end_y: f64, color: String) -> Self {
        let mut segments = Vec::new();
        let mut branches = Vec::new();

        // Generate main bolt with jagged segments
        let segment_count = 15;
        for i in 0..=segment_count {
            let t = i as f64 / segment_count as f64;
            let x = start_x + (end_x - start_x) * t;
            let y = start_y + (end_y - start_y) * t;

            // Add perpendicular offset for jagged effect
            let offset = (random() - 0.5) * 30.0;
            let dx = end_y - start_y;
            let dy = -(end_x - start_x);
            let len = (dx * dx + dy * dy).sqrt();
            let nx = dx / len;
            let ny = dy / len;

            segments.push(Point {
                x: x + nx * offset,
                y: y + ny * offset,
            });
        }

        // Generate 2-4 branches from random points
        let branch_count = (random() * 3.0).floor() as usize + 2;
        for _ in 0..branch_count {
            let branch_start_idx = (random() * (segments.len() as f64 * 0.7)).floor() as usize + 1;
            if branch_start_idx >= segments.len() {
                continue;
            }

            let start_point = &segments[branch_start_idx];
            let branch_length = 5 + (random() * 5.0).floor() as usize;
            let mut branch = Vec::new();
            branch.push(start_point.clone());

            let branch_angle = random() * PI * 2.0;
            for i in 1..=branch_length {
                let dist = i as f64 * 8.0;
                let offset = (random() - 0.5) * 15.0;
                branch.push(Point {
                    x: start_point.x + branch_angle.cos() * dist + offset,
                    y: start_point.y + branch_angle.sin() * dist + offset,
                });
            }
            branches.push(branch);
        }

        Lightning {
            segments,
            branches,
            color,
            line_width: random() * 2.0 + 1.5,
            life: 1.0,
            decay: 0.02,
        }
    }

    pub fn update(&mut self) -> bool {
        self.life -= self.decay;
        self.life > 0.0
    }
}

pub struct DigitalBloom {
    particles: Vec<Particle>,
    vines: Vec<Vine>,
    lightnings: Vec<Lightning>,
    colors: Vec<String>,
    max_particles: usize,
}

impl DigitalBloom {
    pub fn new() -> Self {
        DigitalBloom {
            particles: Vec::new(),
            vines: Vec::new(),
            lightnings: Vec::new(),
            colors: vec![
                "#ff69b4".to_string(), "#00ffff".to_string(), "#7fff00".to_string(),
                "#ff00ff".to_string(), "#ff8c00".to_string(), "#adff2f".to_string(),
                "#d8bfd8".to_string(),
            ],
            max_particles: 500,
        }
    }

    pub fn update(&mut self, width: f64, height: f64) {
        self.vines.retain_mut(|v| v.update(width, height));
        self.particles.retain_mut(|p| p.update(width, height));
        self.lightnings.retain_mut(|l| l.update());
    }

    pub fn create_vine(&mut self, x: f64, y: f64, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        self.vines.push(Vine::new(x, y, color, size, 200.0, 50.0));
    }

    pub fn create_particles_gravity(&mut self, x: f64, y: f64, count: usize, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        for _ in 0..count {
            let vx = (random() - 0.5) * 4.0;
            let vy = -random() * 5.0 - 2.0;
            self.particles.push(Particle::new(x, y, vx, vy, color.clone(), size * 0.5, "gravity".to_string()));
        }
        self.limit_particles();
    }

    pub fn create_particles_bounce(&mut self, x: f64, y: f64, count: usize, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        for _ in 0..count {
            let vx = (random() - 0.5) * 8.0;
            let vy = (random() - 0.5) * 8.0;
            self.particles.push(Particle::new(x, y, vx, vy, color.clone(), size * 0.5, "bounce".to_string()));
        }
        self.limit_particles();
    }

    pub fn create_particles_burst(&mut self, x: f64, y: f64, count: usize, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        for i in 0..count {
            let angle = (PI * 2.0 / count as f64) * i as f64;
            let speed = random() * 6.0 + 2.0;
            let vx = angle.cos() * speed;
            let vy = angle.sin() * speed;
            self.particles.push(Particle::new(x, y, vx, vy, color.clone(), size * 0.5, "burst".to_string()));
        }
        self.limit_particles();
    }

    pub fn create_lightning(&mut self, x: f64, y: f64, _width: f64, height: f64) {
        let end_x = x + (random() - 0.5) * 300.0;
        let end_y = y + (random() * 0.6 + 0.2) * height * 0.5;
        let color = if random() < 0.5 { "#ffffff".to_string() } else { "#00ffff".to_string() };
        self.lightnings.push(Lightning::new(x, y, end_x, end_y, color));
    }

    pub fn create_particles_constellation(&mut self, x: f64, y: f64, count: usize, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        for _ in 0..count {
            let offset_x = (random() - 0.5) * 60.0;
            let offset_y = (random() - 0.5) * 60.0;
            let vx = (random() - 0.5) * 0.5;
            let vy = (random() - 0.5) * 0.5;
            let mut particle = Particle::new(x + offset_x, y + offset_y, vx, vy, color.clone(), size, "constellation".to_string());
            particle.decay = 0.002;
            self.particles.push(particle);
        }
        self.limit_particles();
    }

    pub fn create_particles_vortex(&mut self, x: f64, y: f64, count: usize, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        for i in 0..count {
            let angle = (PI * 2.0 / count as f64) * i as f64 + random() * 0.5;
            let radius = random() * 80.0 + 40.0;
            let particle_x = x + angle.cos() * radius;
            let particle_y = y + angle.sin() * radius;
            self.particles.push(Particle::new_vortex(particle_x, particle_y, x, y, angle, radius, color.clone(), size * 0.6));
        }
        self.limit_particles();
    }

    fn limit_particles(&mut self) {
        if self.particles.len() > self.max_particles {
            let excess = self.particles.len() - self.max_particles;
            self.particles.drain(0..excess);
        }
    }

    pub fn clear(&mut self) {
        self.particles.clear();
        self.vines.clear();
        self.lightnings.clear();
    }

    pub fn particles_slice(&self) -> &[Particle] {
        &self.particles
    }

    pub fn particles_len(&self) -> usize {
        self.particles.len()
    }

    pub fn vines_slice(&self) -> &[Vine] {
        &self.vines
    }

    pub fn lightnings_slice(&self) -> &[Lightning] {
        &self.lightnings
    }
}

// ==================== OPAQUE POINTER TYPES ====================

/// Opaque pointer to DigitalBloom engine (hides Rust internals from C)
#[repr(C)]
pub struct OpaqueDigitalBloom {
    _private: [u8; 0],
}

// ==================== C-COMPATIBLE STRUCTS ====================

/// C-compatible particle representation
#[repr(C)]
#[derive(Copy, Clone, Debug)]
pub struct CParticle {
    pub x: f64,
    pub y: f64,
    pub size: f64,
    pub life: f64,
    pub color_r: u8,
    pub color_g: u8,
    pub color_b: u8,
}

/// C-compatible point representation
#[repr(C)]
#[derive(Copy, Clone, Debug)]
pub struct CPoint {
    pub x: f64,
    pub y: f64,
}

/// C-compatible vine representation
#[repr(C)]
#[derive(Clone, Debug)]
pub struct CVine {
    pub points_ptr: *const CPoint,
    pub points_len: usize,
    pub color_r: u8,
    pub color_g: u8,
    pub color_b: u8,
    pub line_width: f64,
}

/// C-compatible lightning representation
#[repr(C)]
#[derive(Clone, Debug)]
pub struct CLightning {
    pub segments_ptr: *const CPoint,
    pub segments_len: usize,
    pub color_r: u8,
    pub color_g: u8,
    pub color_b: u8,
    pub line_width: f64,
    pub life: f64,
}

/// Error codes for FFI operations
#[repr(C)]
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum DigitalBloomError {
    Success = 0,
    NullPointer = 1,
    InvalidMode = 2,
    OutOfMemory = 3,
}

// ==================== MEMORY MANAGEMENT ====================

/// Create a new DigitalBloom engine
/// 
/// Returns an opaque pointer that must be freed with digital_bloom_destroy()
#[no_mangle]
pub extern "C" fn digital_bloom_create() -> *mut OpaqueDigitalBloom {
    let bloom = Box::new(DigitalBloom::new());
    Box::into_raw(bloom) as *mut OpaqueDigitalBloom
}

/// Destroy a DigitalBloom engine and free its memory
/// 
/// # Safety
/// - ptr must be a valid pointer returned from digital_bloom_create()
/// - ptr must not be used after this call
/// - Calling this function multiple times with the same pointer is undefined behavior
#[no_mangle]
pub extern "C" fn digital_bloom_destroy(ptr: *mut OpaqueDigitalBloom) {
    if ptr.is_null() {
        return;
    }
    
    unsafe {
        let _ = Box::from_raw(ptr as *mut DigitalBloom);
    }
}

// ==================== PHYSICS UPDATE ====================

/// Update the physics simulation by one frame
/// 
/// # Safety
/// - ptr must be a valid pointer returned from digital_bloom_create()
#[no_mangle]
pub extern "C" fn digital_bloom_update(
    ptr: *mut OpaqueDigitalBloom,
    width: f64,
    height: f64
) -> DigitalBloomError {
    if ptr.is_null() {
        return DigitalBloomError::NullPointer;
    }
    
    unsafe {
        let bloom = &mut *(ptr as *mut DigitalBloom);
        bloom.update(width, height);
    }
    
    DigitalBloomError::Success
}

// ==================== PARTICLE CREATION ====================

/// Create particles with specified mode
/// 
/// # Modes
/// - 0: Vine
/// - 1: Gravity
/// - 2: Bounce
/// - 3: Burst
/// - 4: Lightning
/// - 5: Constellation
/// - 6: Vortex
/// 
/// # Safety
/// - ptr must be a valid pointer returned from digital_bloom_create()
#[no_mangle]
pub extern "C" fn digital_bloom_create_particles(
    ptr: *mut OpaqueDigitalBloom,
    mode: u8,
    x: f64,
    y: f64,
    count: usize,
    size: f64
) -> DigitalBloomError {
    if ptr.is_null() {
        return DigitalBloomError::NullPointer;
    }
    
    unsafe {
        let bloom = &mut *(ptr as *mut DigitalBloom);
        
        // Route to appropriate creation function based on mode
        match mode {
            0 => bloom.create_vine(x, y, size),
            1 => bloom.create_particles_gravity(x, y, count, size),
            2 => bloom.create_particles_bounce(x, y, count, size),
            3 => bloom.create_particles_burst(x, y, count, size),
            4 => bloom.create_lightning(x, y, 400.0, 400.0), // Fixed canvas size for watch
            5 => bloom.create_particles_constellation(x, y, count, size),
            6 => bloom.create_particles_vortex(x, y, count, size),
            _ => return DigitalBloomError::InvalidMode,
        }
    }
    
    DigitalBloomError::Success
}

// ==================== PARTICLE RETRIEVAL ====================

/// Get the current number of active particles
///
/// # Safety
/// - ptr must be a valid pointer returned from digital_bloom_create()
#[no_mangle]
pub extern "C" fn digital_bloom_get_particle_count(
    ptr: *const OpaqueDigitalBloom
) -> usize {
    if ptr.is_null() {
        return 0;
    }

    unsafe {
        let bloom = &*(ptr as *const DigitalBloom);
        bloom.particles_len()
    }
}

/// Get the current number of active vines
///
/// # Safety
/// - ptr must be a valid pointer returned from digital_bloom_create()
#[no_mangle]
pub extern "C" fn digital_bloom_get_vine_count(
    ptr: *const OpaqueDigitalBloom
) -> usize {
    if ptr.is_null() {
        return 0;
    }

    unsafe {
        let bloom = &*(ptr as *const DigitalBloom);
        bloom.vines_slice().len()
    }
}

/// Get the current number of active lightning bolts
///
/// # Safety
/// - ptr must be a valid pointer returned from digital_bloom_create()
#[no_mangle]
pub extern "C" fn digital_bloom_get_lightning_count(
    ptr: *const OpaqueDigitalBloom
) -> usize {
    if ptr.is_null() {
        return 0;
    }

    unsafe {
        let bloom = &*(ptr as *const DigitalBloom);
        bloom.lightnings_slice().len()
    }
}

/// Get particles for rendering (includes regular particles + vine points as particles)
///
/// # Safety
/// - ptr must be a valid pointer returned from digital_bloom_create()
/// - out_buffer must point to an array of at least buffer_capacity elements
/// - Returns the actual number of particles written to the buffer
#[no_mangle]
pub extern "C" fn digital_bloom_get_particles(
    ptr: *const OpaqueDigitalBloom,
    out_buffer: *mut CParticle,
    buffer_capacity: usize
) -> usize {
    if ptr.is_null() || out_buffer.is_null() {
        return 0;
    }

    unsafe {
        let bloom = &*(ptr as *const DigitalBloom);
        let mut written = 0;

        // Add regular particles
        let particles = bloom.particles_slice();
        for particle in particles.iter().take(buffer_capacity - written) {
            *out_buffer.add(written) = particle_to_c(particle);
            written += 1;
        }

        // Add vine points as particles
        let vines = bloom.vines_slice();
        for vine in vines.iter() {
            let (r, g, b) = parse_hex_color(&vine.color);
            for point in vine.points.iter().take((buffer_capacity - written).min(vine.points.len())) {
                *out_buffer.add(written) = CParticle {
                    x: point.x,
                    y: point.y,
                    size: vine.line_width,
                    life: 1.0,
                    color_r: r,
                    color_g: g,
                    color_b: b,
                };
                written += 1;
                if written >= buffer_capacity {
                    return written;
                }
            }
        }

        // Add lightning segments as particles
        let lightnings = bloom.lightnings_slice();
        for lightning in lightnings.iter() {
            let (r, g, b) = parse_hex_color(&lightning.color);
            for segment in lightning.segments.iter().take((buffer_capacity - written).min(lightning.segments.len())) {
                *out_buffer.add(written) = CParticle {
                    x: segment.x,
                    y: segment.y,
                    size: lightning.line_width * lightning.life,
                    life: lightning.life,
                    color_r: r,
                    color_g: g,
                    color_b: b,
                };
                written += 1;
                if written >= buffer_capacity {
                    return written;
                }
            }
        }

        written
    }
}

// ==================== UTILITY FUNCTIONS ====================

/// Clear all particles and reset the simulation
/// 
/// # Safety
/// - ptr must be a valid pointer returned from digital_bloom_create()
#[no_mangle]
pub extern "C" fn digital_bloom_clear(ptr: *mut OpaqueDigitalBloom) {
    if ptr.is_null() {
        return;
    }
    
    unsafe {
        let bloom = &mut *(ptr as *mut DigitalBloom);
        bloom.clear();
    }
}

// ==================== HELPER FUNCTIONS ====================

/// Convert internal Particle to C-compatible CParticle
fn particle_to_c(particle: &Particle) -> CParticle {
    // Parse hex color string to RGB
    let (r, g, b) = parse_hex_color(particle.color());

    CParticle {
        x: particle.x(),
        y: particle.y(),
        size: particle.size() * particle.life(), // Scale size by life for fade effect
        life: particle.life(),
        color_r: r,
        color_g: g,
        color_b: b,
    }
}

/// Parse hex color string like "#ff00ff" to RGB tuple
fn parse_hex_color(hex: &str) -> (u8, u8, u8) {
    let hex = hex.trim_start_matches('#');
    
    if hex.len() == 6 {
        if let (Ok(r), Ok(g), Ok(b)) = (
            u8::from_str_radix(&hex[0..2], 16),
            u8::from_str_radix(&hex[2..4], 16),
            u8::from_str_radix(&hex[4..6], 16),
        ) {
            return (r, g, b);
        }
    }
    
    // Fallback to white if parsing fails
    (255, 255, 255)
}

// ==================== TESTS ====================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_destroy() {
        let ptr = digital_bloom_create();
        assert!(!ptr.is_null());
        digital_bloom_destroy(ptr);
    }
    
    #[test]
    fn test_hex_color_parsing() {
        assert_eq!(parse_hex_color("#ff00ff"), (255, 0, 255));
        assert_eq!(parse_hex_color("#00ffff"), (0, 255, 255));
        assert_eq!(parse_hex_color("ff0000"), (255, 0, 0));
    }
}
