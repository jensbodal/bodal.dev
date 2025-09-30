
use wasm_bindgen::prelude::*;
use serde::{Serialize};
use std::f64::consts::PI;

// A simple random number generator
fn random() -> f64 {
    js_sys::Math::random()
}

#[derive(Clone, Serialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Serialize)]
pub struct JsVine {
    points: Vec<Point>,
    color: String,
    line_width: f64,
}

#[derive(Serialize, Clone)]
pub struct JsParticle {
    x: f64,
    y: f64,
    color: String,
    size: f64,
    life: f64,
}

#[derive(Serialize)]
pub struct JsLightning {
    segments: Vec<Point>,
    branches: Vec<Vec<Point>>,
    color: String,
    line_width: f64,
    life: f64,
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
    // Vortex-specific fields
    origin_x: f64,
    origin_y: f64,
    angle: f64,
    radius: f64,
}

impl Particle {
    pub fn new(x: f64, y: f64, vx: f64, vy: f64, color: String, size: f64, mode: String) -> Self {
        Particle {
            x,
            y,
            vx,
            vy,
            color,
            size,
            mode,
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
            x,
            y,
            vx,
            vy,
            color,
            size,
            mode: "vortex".to_string(),
            life: 1.0,
            decay: 0.003,
            origin_x,
            origin_y,
            angle,
            radius,
        }
    }

    pub fn update(&mut self, width: f64, height: f64) -> bool {
        if self.mode == "vortex" {
            // Vortex orbital physics
            self.angle += 0.08; // Angular velocity
            self.radius -= 0.5; // Spiral inward

            if self.radius < 0.0 {
                self.radius = 0.0;
            }

            // Update position based on orbital motion
            self.x = self.origin_x + self.angle.cos() * self.radius;
            self.y = self.origin_y + self.angle.sin() * self.radius;
        } else {
            // Apply friction
            self.vx *= 0.99;
            self.vy *= 0.99;

            // Apply gravity for gravity mode
            if self.mode == "gravity" {
                self.vy += 0.3;
            }

            // Update position
            self.x += self.vx;
            self.y += self.vy;

            // Bounce mode - wall collision
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

        // Decay life
        self.life -= self.decay;

        // Check if particle is still alive and in bounds
        self.life > 0.0 && self.x > -50.0 && self.x < width + 50.0 && self.y > -50.0 && self.y < height + 50.0
    }

    pub fn to_js(&self) -> JsParticle {
        JsParticle {
            x: self.x,
            y: self.y,
            color: self.color.clone(),
            size: self.size * self.life,
            life: self.life,
        }
    }
}

#[wasm_bindgen]
pub struct Vine {
    points: Vec<Point>,
    x: f64,
    y: f64,
    angle: f64,
    speed: f64,
    turn_speed: f64,
    max_length: f64,
    is_grown: bool,
    color: String,
    line_width: f64,
    active: bool,
}

#[wasm_bindgen]
impl Vine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Vine {
        Vine {
            points: Vec::new(),
            x: 0.0,
            y: 0.0,
            angle: 0.0,
            speed: 0.0,
            turn_speed: 0.0,
            max_length: 0.0,
            is_grown: false,
            color: "#ffffff".to_string(),
            line_width: 1.0,
            active: false,
        }
    }

    pub fn init(&mut self, x: f64, y: f64, color: String, size: f64, max_length: f64, min_length: f64) {
        self.x = x;
        self.y = y;
        self.points = vec![Point { x: self.x, y: self.y }];
        self.angle = random() * PI * 2.0;
        self.speed = random() * 2.0 + 0.5;
        self.turn_speed = random() * 0.12 - 0.06;
        self.max_length = random() * max_length + min_length;
        self.is_grown = false;
        self.color = color;
        self.line_width = (random() * size * 0.5) + (size * 0.5);
        self.active = true;
    }

    pub fn update(&mut self, width: f64, height: f64) -> bool {
        if self.is_grown || !self.active {
            return false;
        }

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

    pub fn fade(&mut self) -> bool {
        if !self.active || self.points.is_empty() {
            return false;
        }
        self.points.remove(0);
        self.points.len() > 1
    }

    #[wasm_bindgen(getter)]
    pub fn points(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.points).unwrap()
    }

    #[wasm_bindgen(getter)]
    pub fn color(&self) -> String {
        self.color.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn line_width(&self) -> f64 {
        self.line_width
    }

    #[wasm_bindgen(getter)]
    pub fn is_grown(&self) -> bool {
        self.is_grown
    }
}

pub struct Lightning {
    segments: Vec<Point>,
    branches: Vec<Vec<Point>>,
    color: String,
    line_width: f64,
    life: f64,
    decay: f64,
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

    pub fn to_js(&self) -> JsLightning {
        JsLightning {
            segments: self.segments.clone(),
            branches: self.branches.clone(),
            color: self.color.clone(),
            line_width: self.line_width * self.life,
            life: self.life,
        }
    }
}

#[wasm_bindgen]
pub struct DigitalBloom {
    vines: Vec<Vine>,
    grown_vines: Vec<Vine>,
    particles: Vec<Particle>,
    lightnings: Vec<Lightning>,
    colors: Vec<String>,
    max_length: f64,
    min_length: f64,
    max_particles: usize,
    max_lightnings: usize,
}

#[wasm_bindgen]
impl DigitalBloom {
    #[wasm_bindgen(constructor)]
    pub fn new() -> DigitalBloom {
        let colors: Vec<String> = vec![
            "#ff69b4".to_string(),
            "#00ffff".to_string(),
            "#7fff00".to_string(),
            "#ff00ff".to_string(),
            "#ff8c00".to_string(),
            "#adff2f".to_string(),
            "#d8bfd8".to_string(),
        ];

        DigitalBloom {
            vines: Vec::new(),
            grown_vines: Vec::new(),
            particles: Vec::new(),
            lightnings: Vec::new(),
            colors,
            max_length: 200.0,
            min_length: 50.0,
            max_particles: 500,
            max_lightnings: 20,
        }
    }

    pub fn create_vine(&mut self, x: f64, y: f64, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        let mut vine = Vine::new();
        vine.init(x, y, color, size, self.max_length, self.min_length);
        self.vines.push(vine);
    }

    pub fn create_particles_gravity(&mut self, x: f64, y: f64, count: usize, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        for _ in 0..count {
            let vx = (random() - 0.5) * 4.0;
            let vy = -random() * 5.0 - 2.0;
            let particle = Particle::new(x, y, vx, vy, color.clone(), size * 0.5, "gravity".to_string());
            self.particles.push(particle);
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
            let particle_size = size * (random() * 0.5 + 0.5) * 0.5;
            let particle = Particle::new(x, y, vx, vy, color.clone(), particle_size, "burst".to_string());
            self.particles.push(particle);
        }
        self.limit_particles();
    }

    pub fn create_particles_bounce(&mut self, x: f64, y: f64, count: usize, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        for _ in 0..count {
            let vx = (random() - 0.5) * 8.0;
            let vy = (random() - 0.5) * 8.0;
            let particle = Particle::new(x, y, vx, vy, color.clone(), size * 0.5, "bounce".to_string());
            self.particles.push(particle);
        }
        self.limit_particles();
    }

    pub fn create_particles_constellation(&mut self, x: f64, y: f64, count: usize, size: f64) {
        let color = self.colors[(random() * self.colors.len() as f64).floor() as usize].clone();
        for _ in 0..count {
            let offset_x = (random() - 0.5) * 60.0;
            let offset_y = (random() - 0.5) * 60.0;
            let vx = (random() - 0.5) * 0.5;
            let vy = (random() - 0.5) * 0.5;
            let particle_size = size * (random() * 0.5 + 0.6);
            let mut particle = Particle::new(x + offset_x, y + offset_y, vx, vy, color.clone(), particle_size, "constellation".to_string());
            particle.decay = 0.002; // Slower decay for stars
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
            let particle = Particle::new_vortex(particle_x, particle_y, x, y, angle, radius, color.clone(), size * 0.6);
            self.particles.push(particle);
        }
        self.limit_particles();
    }

    pub fn create_lightning(&mut self, x: f64, y: f64, _width: f64, height: f64) {
        // Generate random endpoint for lightning bolt
        let end_x = x + (random() - 0.5) * 300.0;
        let end_y = y + (random() * 0.6 + 0.2) * height * 0.5; // Prefer downward bolts

        let color = if random() < 0.5 { "#ffffff".to_string() } else { "#00ffff".to_string() };
        let lightning = Lightning::new(x, y, end_x, end_y, color);
        self.lightnings.push(lightning);
        self.limit_lightnings();
    }

    fn limit_lightnings(&mut self) {
        if self.lightnings.len() > self.max_lightnings {
            let excess = self.lightnings.len() - self.max_lightnings;
            self.lightnings.drain(0..excess);
        }
    }

    fn limit_particles(&mut self) {
        if self.particles.len() > self.max_particles {
            let excess = self.particles.len() - self.max_particles;
            self.particles.drain(0..excess);
        }
    }

    pub fn update(&mut self, width: f64, height: f64) {
        // Update vines
        let mut still_active = Vec::new();
        for mut vine in self.vines.drain(..) {
            if vine.update(width, height) {
                still_active.push(vine);
            } else {
                self.grown_vines.push(vine);
            }
        }
        self.vines = still_active;

        let mut still_fading = Vec::new();
        for mut vine in self.grown_vines.drain(..) {
            if vine.fade() {
                still_fading.push(vine);
            }
        }
        self.grown_vines = still_fading;

        // Update particles
        let mut active_particles = Vec::new();
        for mut particle in self.particles.drain(..) {
            if particle.update(width, height) {
                active_particles.push(particle);
            }
        }
        self.particles = active_particles;

        // Update lightning
        let mut active_lightnings = Vec::new();
        for mut lightning in self.lightnings.drain(..) {
            if lightning.update() {
                active_lightnings.push(lightning);
            }
        }
        self.lightnings = active_lightnings;
    }

    #[wasm_bindgen(getter)]
    pub fn vines(&self) -> JsValue {
        let js_vines: Vec<JsVine> = self.vines.iter().map(|v| JsVine {
            points: v.points.clone(),
            color: v.color.clone(),
            line_width: v.line_width,
        }).collect();
        serde_wasm_bindgen::to_value(&js_vines).unwrap()
    }

    #[wasm_bindgen(getter)]
    pub fn grown_vines(&self) -> JsValue {
        let js_vines: Vec<JsVine> = self.grown_vines.iter().map(|v| JsVine {
            points: v.points.clone(),
            color: v.color.clone(),
            line_width: v.line_width,
        }).collect();
        serde_wasm_bindgen::to_value(&js_vines).unwrap()
    }

    #[wasm_bindgen(getter)]
    pub fn particles(&self) -> JsValue {
        let js_particles: Vec<JsParticle> = self.particles.iter().map(|p| p.to_js()).collect();
        serde_wasm_bindgen::to_value(&js_particles).unwrap()
    }

    #[wasm_bindgen(getter)]
    pub fn lightnings(&self) -> JsValue {
        let js_lightnings: Vec<JsLightning> = self.lightnings.iter().map(|l| l.to_js()).collect();
        serde_wasm_bindgen::to_value(&js_lightnings).unwrap()
    }

    pub fn clear(&mut self) {
        self.vines.clear();
        self.grown_vines.clear();
        self.particles.clear();
        self.lightnings.clear();
    }
}
