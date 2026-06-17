import { TorusRenderer } from "./torus-renderer";
import { getElementById } from "./dom";
import { VoicingManager } from "./voicing-manager";
import { setupArpeggioSettings } from "./ArpeggioSettings";

async function main(): Promise<void> {
    const stage = getElementById("torus-stage", HTMLDivElement);
    const chordLayer = getElementById("torus-chord-layer", HTMLDivElement);
    const gridCanvas = getElementById("torus-grid", HTMLCanvasElement);
    const voicingManager = new VoicingManager();

    const torusRenderer = new TorusRenderer({
        stage: stage,
        chordLayer: chordLayer,
        gridCanvas: gridCanvas,
        onChordSelected: async (chord) => {
            await voicingManager.playChord(chord);
        },
    });

    setupArpeggioSettings(() => {
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

    torusRenderer.renderScene();
}

void main();

