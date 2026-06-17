const fs = require("fs");
const path = require("path");
const { copyStaticFiles } = require("./copyStatic.cjs");

const SRC_DIR = path.resolve(__dirname, "..", "src");
let debounceTimer = null;

function isTypeScriptFile(fileName) {
    return /\.(ts|tsx)$/i.test(fileName);
}

function syncStatic(changedPath) {
    try {
        copyStaticFiles();
        if (changedPath) {
            console.log("[copy:static:watch] synced", changedPath);
        }
    } catch (error) {
        console.error("[copy:static:watch] sync failed");
        console.error(error && error.stack ? error.stack : error);
    }
}

syncStatic();

fs.watch(SRC_DIR, { recursive: true }, (_eventType, fileName) => {
    if (!fileName || isTypeScriptFile(fileName)) {
        return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        syncStatic(fileName);
    }, 60);
});

console.log("[copy:static:watch] watching src for non-TS file changes");
