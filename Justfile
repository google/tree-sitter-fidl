default:
    @just --list

# Generate parser and build bindings
build:
    npm run build
    cargo build

# Run Tree-sitter and Rust tests
test:
    npm test
    cargo test

# Format Rust and JS/TS source code
fmt:
    cargo fmt
    npm run fmt

# Run Rust and JS/TS linters and formatting checks
lint:
    cargo fmt -- --check
    cargo clippy --all-targets -- -D warnings
    npm run lint
