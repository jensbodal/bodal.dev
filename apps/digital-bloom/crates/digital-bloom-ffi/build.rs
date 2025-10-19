// Build script to auto-generate C header during compilation
use std::env;
use std::path::PathBuf;

fn main() {
    let crate_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let output_file = target_dir()
        .join("digital_bloom.h")
        .display()
        .to_string();

    match cbindgen::Builder::new()
        .with_crate(crate_dir)
        .with_language(cbindgen::Language::C)
        .with_parse_deps(false)
        .generate()
    {
        Ok(bindings) => {
            bindings.write_to_file(&output_file);
            println!("cargo:rerun-if-changed=src/lib.rs");
        }
        Err(err) => {
            eprintln!("Warning: cbindgen failed: {:?}", err);
        }
    }
}

fn target_dir() -> PathBuf {
    PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap()).join("include")
}
