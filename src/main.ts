import { TorusRenderer } from "./torus-renderer";
import { getElementById } from "./dom";
import { VoicingManager } from "./voicing-manager";
import { setupArpeggioControls } from "./arpeggio-controls";
import { KeyboardCanvas } from "./keyboard-canvas";
import { WhisqCanvas } from "./whisq-canvas";

async function main(): Promise<void> {
    const stage = getElementById("torus-stage", HTMLDivElement);
    const chordLayer = getElementById("torus-chord-layer", HTMLDivElement);
    const gridCanvas = getElementById("torus-grid", HTMLCanvasElement);
    const keyboardCanvasElement = getElementById("keyboard-canvas", HTMLCanvasElement);
    const whisqCanvasElement = getElementById("whisq-canvas", HTMLCanvasElement);
    const keyboardCanvas = new KeyboardCanvas(keyboardCanvasElement);
    const whisqCanvas = new WhisqCanvas(whisqCanvasElement);
    const voicingManager = new VoicingManager((voicing) => {
        keyboardCanvas.setVoicing(voicing);
        whisqCanvas.setVoicing(voicing);
    });

    const torusRenderer = new TorusRenderer({
        stage: stage,
        chordLayer: chordLayer,
        gridCanvas: gridCanvas,
        onChordSelected: async (chord) => {
            await voicingManager.playChord(chord);
        },
    });

    setupArpeggioControls(() => {
        voicingManager.replayActiveVoicing();
    },);

    const upButton = getElementById("btn-voicing-up", HTMLButtonElement);
    upButton.addEventListener("click", () => {
        voicingManager.shiftActiveVoicing("up");
    });

    const downButton = getElementById("btn-voicing-down", HTMLButtonElement);
    downButton.addEventListener("click", () => {
        voicingManager.shiftActiveVoicing("down");
    });

    const stopButton = getElementById("btn-stop", HTMLButtonElement);
    stopButton.addEventListener("click", () => {
        voicingManager.stopChord();
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

