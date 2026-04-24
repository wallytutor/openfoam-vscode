const path = require("path");
const vscode = require("vscode");

const LANGUAGE_ID = "openfoam-dict";
const FALLBACK_LANGUAGE_ID = "plaintext";
const CONFIG_NAMESPACE = "openfoamDictHighlight";
const CONFIG_FILENAMES_KEY = "additionalFilenames";
const CONFIG_PATTERNS_KEY = "additionalFilenamePatterns";
const EXTENSION_ID = "WalterDalMazSilva.openfoam-vscode";

function normalizeFilename(name) {
    return name.trim().toLowerCase();
}

function getBuiltInFilenames() {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    const filenames = extension?.packageJSON?.contributes?.languages?.find(
        (language) => language.id === LANGUAGE_ID
    )?.filenames;

    if (!Array.isArray(filenames)) {
        return [];
    }

    return filenames.filter((value) => typeof value === "string");
}

function getConfiguredFilenames() {
    const configured = vscode.workspace
        .getConfiguration(CONFIG_NAMESPACE)
        .get(CONFIG_FILENAMES_KEY, []);

    if (!Array.isArray(configured)) {
        return [];
    }

    return configured
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);
}

function getConfiguredFilenamePatterns() {
    const configured = vscode.workspace
        .getConfiguration(CONFIG_NAMESPACE)
        .get(CONFIG_PATTERNS_KEY, []);

    if (!Array.isArray(configured)) {
        return [];
    }

    return configured
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);
}

function buildFilenameMatchers() {
    const filenames = new Set(
        [...getBuiltInFilenames(), ...getConfiguredFilenames()].map(normalizeFilename)
    );
    const invalidPatterns = [];
    const patterns = getConfiguredFilenamePatterns().flatMap((pattern) => {
        try {
            return [new RegExp(pattern, "i")];
        } catch {
            invalidPatterns.push(pattern);
            return [];
        }
    });

    return {
        filenames,
        patterns,
        invalidPatterns,
    };
}

function warnAboutInvalidPatterns(invalidPatterns) {
    if (invalidPatterns.length === 0) {
        return;
    }

    const quotedPatterns = invalidPatterns.map((pattern) => `"${pattern}"`).join(", ");
    void vscode.window.showWarningMessage(
        `OpenFOAM Dictionary Highlight ignored invalid regex pattern(s): ${quotedPatterns}`
    );
}

function isEligibleDocument(document) {
    return document.uri.scheme === "file";
}

function isMatch(document, filenameMatchers) {
    if (!isEligibleDocument(document)) {
        return false;
    }

    const basename = normalizeFilename(path.basename(document.fileName));
    return (
        filenameMatchers.filenames.has(basename)
        || filenameMatchers.patterns.some((pattern) => pattern.test(basename))
    );
}

async function applyLanguageIfMatch(document, filenameMatchers) {
    const matches = isMatch(document, filenameMatchers);

    if (matches && document.languageId !== LANGUAGE_ID) {
        await vscode.languages.setTextDocumentLanguage(document, LANGUAGE_ID);
        return;
    }

    if (!matches && document.languageId === LANGUAGE_ID) {
        await vscode.languages.setTextDocumentLanguage(document, FALLBACK_LANGUAGE_ID);
    }
}

async function applyLanguageToOpenDocuments(filenameMatchers) {
    const tasks = vscode.workspace.textDocuments.map((document) =>
        applyLanguageIfMatch(document, filenameMatchers)
    );
    await Promise.allSettled(tasks);
}

function activate(context) {
    let filenameMatchers = buildFilenameMatchers();
    warnAboutInvalidPatterns(filenameMatchers.invalidPatterns);

    void applyLanguageToOpenDocuments(filenameMatchers);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            void applyLanguageIfMatch(document, filenameMatchers);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidRenameFiles(() => {
            void applyLanguageToOpenDocuments(filenameMatchers);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (!event.affectsConfiguration(CONFIG_NAMESPACE)) {
                return;
            }

            filenameMatchers = buildFilenameMatchers();
            warnAboutInvalidPatterns(filenameMatchers.invalidPatterns);
            void applyLanguageToOpenDocuments(filenameMatchers);
        })
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};
