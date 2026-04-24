# OpenFOAM Dictionary Highlight

Minimal syntax highlighter for OpenFOAM dictionary files in VS Code.

Available on [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=WalterDalMazSilva.openfoam-vscode) and installable locally (see instructions below).

---

## Supported files

The extension auto-detects several filenames with no manual file association; common files such as `controlDict`, `decomposeParDict`, and `fvSolution` are included in the built-in list. You can also add custom filenames or regex filename patterns via extension settings (see below). The extension supports C-style comments, delimiters, strings, and OpenFOAM-style dictionary entries.

It is a design choice to use exact filename matching for built-in detection, with optional user-defined regex patterns when you need broader matching. Also, the file list is not exhaustive and can be extended by users as needed, as their field of expertise may require highlighting of additional dictionary files than the ones provided by default.

You can add your own dictionary file names or regex patterns via extension settings (in `settings.json`), using the following configuration:

- Setting key: `openfoamDictHighlight.additionalFilenames`
- Type: array of strings
- Match mode: exact file name, case-insensitive match
- Setting key: `openfoamDictHighlight.additionalFilenamePatterns`
- Type: array of strings
- Match mode: JavaScript regex, case-insensitive match against the basename

Example:

```json
{
    "openfoamDictHighlight.additionalFilenames": [
        "mySolverDict",
        "regionProperties",
        "combustionProperties"
    ],
    "openfoamDictHighlight.additionalFilenamePatterns": [
        "^physicalProperties(?:\\..+)?$"
    ]
}
```

That pattern matches both `physicalProperties` and names such as `physicalProperties.gas`.

After changing these settings, the extension reapplies language detection to currently open files. If an open file no longer matches the built-in names, configured names, or configured regex patterns, it is reset to plaintext.

Alternative fallback (if you prefer native VS Code association behavior) is to use `files.associations`, for example:

```json
{
    "files.associations": {
        "**/mySolverDict": "openfoam-dict"
    }
}
```

---

## Install locally

### Option 1: Install unpacked extension folder

1. Open VS Code.
2. Open Extensions view.
3. Select `...` (More Actions) -> `Install from Location...`.
4. Pick this extension's root folder.

### Option 2: Package as VSIX and install

1. Install `vsce` by running `npm install -g @vscode/vsce` in your terminal.

2. From this directory, package this extension with `vsce package`

3. In VS Code, run `Extensions: Install from VSIX...` and select the generated `.vsix` file.
