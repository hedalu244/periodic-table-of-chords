import { ChordTableVisibility } from "./chord-table";
import { getElementById } from "./dom";

export type ChordVisibilityChanged = (visibility: ChordTableVisibility) => void;

function readVisibilityState(
    diminishedSeventhInput: HTMLInputElement,
    diminishedInput: HTMLInputElement,
    halfdiminishedInput: HTMLInputElement,
    minorTriadInput: HTMLInputElement,
    minorSeventhInput: HTMLInputElement,
    majorTriadInput: HTMLInputElement,
    dominantSeventhInput: HTMLInputElement,
): ChordTableVisibility {
    return {
        diminishedSeventh: diminishedSeventhInput.checked,
        diminished: diminishedInput.checked,
        halfdiminished: halfdiminishedInput.checked,
        minorTriad: minorTriadInput.checked,
        minorSeventh: minorSeventhInput.checked,
        majorTriad: majorTriadInput.checked,
        dominantSeventh: dominantSeventhInput.checked,
    };
}

export function setupVisibilityControls(onChanged: ChordVisibilityChanged): void {
    const diminishedSeventhInput = getElementById("visibility-dim7", HTMLInputElement);
    const diminishedInput = getElementById("visibility-dim", HTMLInputElement);
    const halfdiminishedInput = getElementById("visibility-m7b5", HTMLInputElement);
    const minorTriadInput = getElementById("visibility-minor", HTMLInputElement);
    const minorSeventhInput = getElementById("visibility-minor7", HTMLInputElement);
    const majorTriadInput = getElementById("visibility-major", HTMLInputElement);
    const dominantSeventhInput = getElementById("visibility-dominant7", HTMLInputElement);

    const update = (): void => {
        onChanged(readVisibilityState(
            diminishedSeventhInput,
            diminishedInput,
            halfdiminishedInput,
            minorTriadInput,
            minorSeventhInput,
            majorTriadInput,
            dominantSeventhInput,
        ));
    };

    const checkboxInputs = [
        diminishedSeventhInput,
        diminishedInput,
        halfdiminishedInput,
        minorTriadInput,
        minorSeventhInput,
        majorTriadInput,
        dominantSeventhInput,
    ];

    for (const input of checkboxInputs) {
        input.addEventListener("change", update);
    }

    update();
}
