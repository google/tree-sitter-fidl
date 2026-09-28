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

# Download sdk/fidl from Fuchsia main branch
download-fuchsia-fidl:
    rm -rf fuchsia-sdk-fidl
    git clone --filter=blob:none --no-checkout --depth 1 --sparse --branch main https://fuchsia.googlesource.com/fuchsia fuchsia-sdk-fidl
    git -C fuchsia-sdk-fidl sparse-checkout set sdk/fidl
    git -C fuchsia-sdk-fidl checkout
    @echo "Fuchsia commit: $(git -C fuchsia-sdk-fidl rev-parse HEAD)"

# Run parser against Fuchsia sdk/fidl files
test-fuchsia-fidl:
    @if [ ! -d fuchsia-sdk-fidl/sdk/fidl ]; then \
        echo "fuchsia-sdk-fidl not found. Run 'just download-fuchsia-fidl' first."; \
        exit 1; \
    fi
    @echo "Testing Fuchsia commit: $(git -C fuchsia-sdk-fidl rev-parse HEAD)"
    npx tree-sitter parse -q -s "fuchsia-sdk-fidl/sdk/fidl/**/*.fidl"
