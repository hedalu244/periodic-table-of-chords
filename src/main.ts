import { TorusRenderer } from "./torus-renderer";
import { getElementById } from "./dom";
import { VoicingManager } from "./voicing-manager";
import { setupArpeggioControls } from "./arpeggio-controls";
import { KeyboardCanvas } from "./keyboard-canvas";
import { WhisqCanvas } from "./whisq-canvas";
import { nameChordWithInversion, Voicing } from "./chord-utils";

function renderCurrentChordName(
    chordLabelElement: HTMLParagraphElement,
    selectedChordName: string | null,
    currentVoicing: Voicing | null,
): void {
    if (selectedChordName === null || currentVoicing === null) {
        chordLabelElement.textContent = "-";
        return;
    }
    chordLabelElement.textContent = nameChordWithInversion(selectedChordName, currentVoicing);
}

async function main(): Promise<void> {
    const stage = getElementById("torus-stage", HTMLDivElement);
    const chordLayer = getElementById("torus-chord-layer", HTMLDivElement);
    const gridCanvas = getElementById("torus-grid", HTMLCanvasElement);
    const keyboardCanvasElement = getElementById("keyboard-canvas", HTMLCanvasElement);
    const whisqCanvasElement = getElementById("whisq-canvas", HTMLCanvasElement);
    const currentChordNameElement = getElementById("current-chord-name", HTMLParagraphElement);
    const keyboardCanvas = new KeyboardCanvas(keyboardCanvasElement);
    const whisqCanvas = new WhisqCanvas(whisqCanvasElement);

    let selectedChordName: string | null = null;
    let currentVoicing: Voicing | null = null;

    const voicingManager = new VoicingManager((voicing) => {
        currentVoicing = voicing;
        keyboardCanvas.setVoicing(voicing);
        whisqCanvas.setVoicing(voicing);
        renderCurrentChordName(currentChordNameElement, selectedChordName, currentVoicing);
    });

    const torusRenderer = new TorusRenderer({
        stage: stage,
        chordLayer: chordLayer,
        gridCanvas: gridCanvas,
        onChordSelected: async (chordName, chord) => {
            selectedChordName = chordName;
            await voicingManager.playChord(chord);
            renderCurrentChordName(currentChordNameElement, selectedChordName, currentVoicing);
        },
    });

    setupArpeggioControls(() => {
        voicingManager.replayActiveVoicing();
    },);

    const upButton = getElementById("btn-invert-up", HTMLButtonElement);
    upButton.addEventListener("click", () => {
        voicingManager.shiftActiveVoicing("up");
    });

    const downButton = getElementById("btn-invert-down", HTMLButtonElement);
    downButton.addEventListener("click", () => {
        voicingManager.shiftActiveVoicing("down");
    });

    const stopButton = getElementById("btn-stop", HTMLButtonElement);
    stopButton.addEventListener("click", () => {
        voicingManager.stopChord();
        selectedChordName = null;
        renderCurrentChordName(currentChordNameElement, selectedChordName, currentVoicing);
        torusRenderer.clearActiveChord();
    });

    window.addEventListener("beforeunload", () => {
        keyboardCanvas.dispose();
        whisqCanvas.dispose();
        torusRenderer.dispose();
    });

    torusRenderer.renderScene();
}

void main();

