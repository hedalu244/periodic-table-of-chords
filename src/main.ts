import { AudioBackend } from "./AudioBackend";
import { ChordPlayer, Voicing } from "./ChordPlayer";
import { getArpeggioSettings } from "./ArpeggioSettings";
import { getElementById } from "./dom";

interface DemoButtonConfig {
    id: string;
    voicing: Voicing;
}

const DEMO_BUTTONS: DemoButtonConfig[] = [
    {
        id: "btn-chord-a-major7",
        voicing: [57, 61, 64, 68],
    },
    {
        id: "btn-chord-a-minor",
        voicing: [57, 60, 64],
    },
    {
        id: "btn-chord-a-minor7",
        voicing: [57, 60, 64, 67],
    },
    {
        id: "btn-chord-g-major7",
        voicing: [55, 59, 62, 65],
    },
    {
        id: "btn-chord-f-major7",
        voicing: [53, 57, 60, 64],
    },
];

async function main(): Promise<void> {
    const backend = new AudioBackend();
    const player = new ChordPlayer(backend);

    let isAudioReady = false;
    let lastVoicing: Voicing | null = null;

    async function prepareAudio(): Promise<void> {
        if (isAudioReady) {
            await backend.resume();
            return;
        }
        await backend.initialize();
        await backend.resume();
        isAudioReady = true;
    }

    function replayLastVoicing(): void {
        if (lastVoicing === null) {
            return;
        }
        const arpeggio = getArpeggioSettings();
        player.play(lastVoicing, arpeggio);
    }

    for (const demo of DEMO_BUTTONS) {
        const button = getElementById(demo.id, HTMLButtonElement);
        button.addEventListener("click", async () => {
            await prepareAudio();
            lastVoicing = [...demo.voicing];
            const arpeggio = getArpeggioSettings();
            player.play(lastVoicing, arpeggio);
        });
    }

    const arpeggioTypeInputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="arpeggio-type"]'
    );
    for (const typeInput of arpeggioTypeInputs) {
        typeInput.addEventListener("change", () => {
            replayLastVoicing();
        });
    }

    const offsetInput = getElementById("input-arpeggio-offset-ms", HTMLInputElement);
    offsetInput.addEventListener("input", () => {
        replayLastVoicing();
    });

    const stopButton = getElementById("btn-stop", HTMLButtonElement);
    stopButton.addEventListener("click", () => {
        player.stop();
    });
}

void main();
