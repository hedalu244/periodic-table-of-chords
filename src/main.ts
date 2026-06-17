import { AudioBackend } from "./AudioBackend";
import { Chord, ChordPlayer, Voicing } from "./ChordPlayer";
import { getArpeggioSettings } from "./ArpeggioSettings";
import { getElementById } from "./dom";
import { decideVoicing, invertVoicing } from "./voicing";

interface DemoButtonConfig {
    id: string;
    chord: Chord;
}

const DEMO_BUTTONS: DemoButtonConfig[] = [
    {
        id: "btn-chord-c-major7",
        chord: [0, 4, 7, 11],
    },
    {
        id: "btn-chord-d-minor7",
        chord: [2, 5, 9, 12],
    },
    {
        id: "btn-chord-e-minor7",
        chord: [4, 7, 11, 14],
    },
    {
        id: "btn-chord-f-major7",
        chord: [5, 9, 12, 16],
    },
    {
        id: "btn-chord-g7",
        chord: [7, 11, 14, 17],
    },
    {
        id: "btn-chord-a-minor7",
        chord: [9, 12, 16, 19],
    },
    {
        id: "btn-chord-b-minor7-flat5",
        chord: [11, 14, 17, 21],
    },
];

async function main(): Promise<void> {
    const backend = new AudioBackend();
    const player = new ChordPlayer(backend);

    let isAudioReady = false;
    let lastVoicing: Voicing | null = null;
    let lastChord: Chord | null = null;

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
            lastChord = [...demo.chord];
            lastVoicing = decideVoicing(lastChord, lastVoicing === null ? undefined : lastVoicing);
            const arpeggio = getArpeggioSettings();
            player.play(lastVoicing, arpeggio);
        });
    }

    const upButton = getElementById("btn-voicing-up", HTMLButtonElement);
    upButton.addEventListener("click", async () => {
        if (lastVoicing === null || lastChord === null) {
            return;
        }
        await prepareAudio();
        lastVoicing = invertVoicing(lastVoicing, "up");
        const arpeggio = getArpeggioSettings();
        player.play(lastVoicing, arpeggio);
    });

    const downButton = getElementById("btn-voicing-down", HTMLButtonElement);
    downButton.addEventListener("click", async () => {
        if (lastVoicing === null || lastChord === null) {
            return;
        }
        await prepareAudio();
        lastVoicing = invertVoicing(lastVoicing, "down");
        const arpeggio = getArpeggioSettings();
        player.play(lastVoicing, arpeggio);
    });

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
