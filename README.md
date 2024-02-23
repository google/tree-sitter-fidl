# Tree Sitter FIDL

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

**NeoVim**

### NeoVim Treesitter

*Require NeoVim version > 0.9* to use [nvim-treesitter][] plugin.

`:TSInstall fidl` to install in NeoVim.

You may need to install `tree-sitter` and `nodejs`.

Add filetype mapping, you may add this to `<nvim-config>/lua/options.lua`:

```lua
vim.filetype.add({ extension = { fidl = "fidl" } })
```

#### local installation

add following to the place you config `nvim-treesitter`:

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.fidl = {
  install_info = {
    url = "path/to/tree-sitter-fidl",
    files = { "src/parser.c" },
    -- generate from grammar is required because we did not upload generated
    -- files.
    requires_generate_from_grammar = true,
  },
  filetype = "fidl",
}
```

and copy `queries/*` to `nvim-runtime-dir/queries/fidl/`, check `:h rtp` for how to locate the dir,
usually `$XDG_CONFIG_HOME/nvim` is one of the runtime-dir.

`:TSInstall fidl` to install, and `:TSUpdate` for update the parser.

## TODOs

- [ ] setup github actions to pull fuchsia repo and verify sdk every half year
- [ ] add instructions for emacs usage


## License

[Apache-2.0](LICENSE)

Disclaimer: _This is not an officially supported Google product._

<!-- xref -->
[tree-sitter]: https://github.com/tree-sitter/tree-sitter
[FIDL files]: https://fuchsia.dev/fuchsia-src/reference/fidl/language/language
[FIDL grammar]: https://cs.opensource.google/fuchsia/fuchsia/+/main:docs/reference/fidl/language/grammar.md
[nvim-treesitter]: https://github.com/nvim-treesitter/nvim-treesitter
