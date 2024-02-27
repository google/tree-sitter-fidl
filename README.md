# Tree Sitter FIDL

Disclaimer: _This is not an officially supported Google product._

This is [tree-sitter][] parser for [FIDL files][] (Fuchsia Interface Definition Language).

It provides fast syntax tree based code highlighting and code folding for
Fuchsia developers using tree-sitter supported editors (NeoVim / Emacs).

## Developement

1. Setup tree-sitter development, either rust cli or nodejs cli work.
   https://tree-sitter.github.io/tree-sitter/creating-parsers.
1. Make changes, run `tree-sitter generate` and `tree-sitter test` to test.
1. Try the changes, run `tree-sitter parse a/fidl/file` to see the highlight.
1. Test all FIDL files in fuchsia repo `/sdk/fidl`,
   `tree-sitter parse path/to/fuchsia/sdk/fidl/**.fidl | grep ERROR | grep fidl`
   ensure no error.
1. For FIDL syntax, You can check the [FIDL grammar][] in Fuchsia repo.

## File sturcture

- `grammar.js` is the definition of parsers.
- `corpus/` stores test cases.
- `queries` stores syntax meanings for highlighting.

## Installation

### NeoVim

*Require NeoVim version > 0.9* to use [nvim-treesitter][] plugin.

`:TSInstall fidl` to install in NeoVim.

Add filetype mapping, you may add this to `<nvim-config>/lua/options.lua`:

```lua
vim.filetype.add({ extension = { fidl = "fidl" } })
```

#### local installation

You may need to install using local parser and queries when you want to debug
`queries/*.scm` changes.

Add following to the place you config `nvim-treesitter`:

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.fidl = {
  install_info = {
    url = "path/to/tree-sitter-fidl",
    files = { "src/parser.c" },
  },
}
```

and copy `queries/*` to `nvim-runtime-dir/queries/fidl/`, check `:h rtp` for how to locate the dir,
usually `$XDG_CONFIG_HOME/nvim` is one of the runtime-dir.

`:TSInstall fidl` to install, and `:TSUpdate` for update the parser.

### Helix

*Require Helix version >= 
[358ac6bc1f512ca7303856dc904d4b4cdc1fe718](https://github.com/helix-editor/helix/commit/358ac6bc1f512ca7303856dc904d4b4cdc1fe718)*
(will update this version when the commit landed to release)

Tree Sitter FIDL works out of box like other language support on helix.

```
hx --grammar fetch fidl
hx --grammar build fidl
mkdir -p ~/.config/helix/runtime/queries/
cp -r <path to helix source>/runtime/queries/fidl ~/.config/helix/runtime/queries
```

### Emacs

Charles Celerier has a WIP cl for Emacs usage https://fuchsia-review.git.corp.google.com/c/fuchsia/+/996186.

It does not have instructions yet, but you may able to figure out how it works.

## TODOs

- [ ] setup github actions to pull fuchsia repo and verify sdk every half year
- [ ] add instructions for emacs usage

## License

[Apache-2.0](LICENSE)



<!-- xref -->
[tree-sitter]: https://github.com/tree-sitter/tree-sitter
[FIDL files]: https://fuchsia.dev/fuchsia-src/reference/fidl/language/language
[FIDL grammar]: https://cs.opensource.google/fuchsia/fuchsia/+/main:docs/reference/fidl/language/grammar.md
[nvim-treesitter]: https://github.com/nvim-treesitter/nvim-treesitter
