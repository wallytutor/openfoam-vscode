const path = require("path");
const vscode = require("vscode");

const LANGUAGE_ID = "openfoam-dict";
const FALLBACK_LANGUAGE_ID = "plaintext";
const CONFIG_NAMESPACE = "openfoamDictHighlight";
const CONFIG_KEY = "additionalFilenames";
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
        .get(CONFIG_KEY, []);

    if (!Array.isArray(configured)) {
        return [];
    }

    return configured
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);
}

function buildFilenameSet() {
    const all = [...getBuiltInFilenames(), ...getConfiguredFilenames()];
    return new Set(all.map(normalizeFilename));
}

function isEligibleDocument(document) {
    return document.uri.scheme === "file";
}

function isMatch(document, knownFilenames) {
    if (!isEligibleDocument(document)) {
        return false;
    }

    const basename = normalizeFilename(path.basename(document.fileName));
    return knownFilenames.has(basename);
}

async function applyLanguageIfMatch(document, knownFilenames) {
    const matches = isMatch(document, knownFilenames);

    if (matches && document.languageId !== LANGUAGE_ID) {
        await vscode.languages.setTextDocumentLanguage(document, LANGUAGE_ID);
        return;
    }

    if (!matches && document.languageId === LANGUAGE_ID) {
        await vscode.languages.setTextDocumentLanguage(document, FALLBACK_LANGUAGE_ID);
    }
}

async function applyLanguageToOpenDocuments(knownFilenames) {
    const tasks = vscode.workspace.textDocuments.map((document) =>
        applyLanguageIfMatch(document, knownFilenames)
    );
    await Promise.allSettled(tasks);
}

function activate(context) {
    let knownFilenames = buildFilenameSet();

    void applyLanguageToOpenDocuments(knownFilenames);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            void applyLanguageIfMatch(document, knownFilenames);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidRenameFiles(() => {
            void applyLanguageToOpenDocuments(knownFilenames);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (!event.affectsConfiguration(CONFIG_NAMESPACE)) {
                return;
            }

            knownFilenames = buildFilenameSet();
            void applyLanguageToOpenDocuments(knownFilenames);
        })
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};
