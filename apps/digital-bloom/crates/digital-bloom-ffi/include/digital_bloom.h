#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

/**
 * Error codes for FFI operations
 */
typedef enum DigitalBloomError {
  Success = 0,
  NullPointer = 1,
  InvalidMode = 2,
  OutOfMemory = 3,
} DigitalBloomError;

/**
 * Opaque pointer to DigitalBloom engine (hides Rust internals from C)
 */
typedef struct OpaqueDigitalBloom {
  uint8_t _private[0];
} OpaqueDigitalBloom;

/**
 * C-compatible particle representation
 */
typedef struct CParticle {
  double x;
  double y;
  double size;
  double life;
  uint8_t color_r;
  uint8_t color_g;
  uint8_t color_b;
} CParticle;

/**
 * C-compatible point representation
 */
typedef struct CPoint {
  double x;
  double y;
} CPoint;

/**
 * C-compatible vine representation
 */
typedef struct CVine {
  const struct CPoint *points_ptr;
  uintptr_t points_len;
  uint8_t color_r;
  uint8_t color_g;
  uint8_t color_b;
  double line_width;
} CVine;

/**
 * C-compatible lightning representation
 */
typedef struct CLightning {
  const struct CPoint *segments_ptr;
  uintptr_t segments_len;
  uint8_t color_r;
  uint8_t color_g;
  uint8_t color_b;
  double line_width;
  double life;
} CLightning;

/**
 * Create a new DigitalBloom engine
 *
 * Returns an opaque pointer that must be freed with digital_bloom_destroy()
 */
struct OpaqueDigitalBloom *digital_bloom_create(void);

/**
 * Destroy a DigitalBloom engine and free its memory
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 * - ptr must not be used after this call
 * - Calling this function multiple times with the same pointer is undefined behavior
 */
void digital_bloom_destroy(struct OpaqueDigitalBloom *ptr);

/**
 * Update the physics simulation by one frame
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 */
enum DigitalBloomError digital_bloom_update(struct OpaqueDigitalBloom *ptr,
                                            double width,
                                            double height);

/**
 * Create particles with specified mode
 *
 * # Modes
 * - 0: Vine
 * - 1: Gravity
 * - 2: Bounce
 * - 3: Burst
 * - 4: Lightning
 * - 5: Constellation
 * - 6: Vortex
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 */
enum DigitalBloomError digital_bloom_create_particles(struct OpaqueDigitalBloom *ptr,
                                                      uint8_t mode,
                                                      double x,
                                                      double y,
                                                      uintptr_t count,
                                                      double size);

/**
 * Get the current number of active particles
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 */
uintptr_t digital_bloom_get_particle_count(const struct OpaqueDigitalBloom *ptr);

/**
 * Get the current number of active vines
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 */
uintptr_t digital_bloom_get_vine_count(const struct OpaqueDigitalBloom *ptr);

/**
 * Get the current number of active lightning bolts
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 */
uintptr_t digital_bloom_get_lightning_count(const struct OpaqueDigitalBloom *ptr);

/**
 * Get ONLY real particles for rendering (excludes vine points and lightning)
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 * - out_buffer must point to an array of at least buffer_capacity elements
 * - Returns the actual number of particles written to the buffer
 */
uintptr_t digital_bloom_get_particles(const struct OpaqueDigitalBloom *ptr,
                                      struct CParticle *out_buffer,
                                      uintptr_t buffer_capacity);

/**
 * Get vines for path rendering (much more efficient than rendering as particles)
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 * - out_vines must point to an array of at least buffer_capacity CVine elements
 * - out_points must point to an array large enough to hold all vine points
 * - Returns the actual number of vines written
 *
 * # Memory Layout
 * Each CVine contains a pointer into the out_points array
 */
uintptr_t digital_bloom_get_vines(const struct OpaqueDigitalBloom *ptr,
                                  struct CVine *out_vines,
                                  uintptr_t buffer_capacity,
                                  struct CPoint *out_points,
                                  uintptr_t points_capacity);

/**
 * Get lightning bolts for path rendering
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 * - out_lightning must point to an array of at least buffer_capacity elements
 * - out_segments must point to an array large enough to hold all segments
 * - Returns the actual number of lightning bolts written
 */
uintptr_t digital_bloom_get_lightning(const struct OpaqueDigitalBloom *ptr,
                                      struct CLightning *out_lightning,
                                      uintptr_t buffer_capacity,
                                      struct CPoint *out_segments,
                                      uintptr_t segments_capacity);

/**
 * Clear all particles and reset the simulation
 *
 * # Safety
 * - ptr must be a valid pointer returned from digital_bloom_create()
 */
void digital_bloom_clear(struct OpaqueDigitalBloom *ptr);
