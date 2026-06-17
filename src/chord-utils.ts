export type PitchClass = number;
export type Octave = number;
export type Pitch = number;
export type Chord = PitchClass[];
export type Voicing = Pitch[];

export type ChordWithName = {
    name: string;
    chord: Chord;
};

export function getNoteName(pitchClass: PitchClass): string {
    const noteNames = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    return noteNames[pitchClass % 12];
}

export function getPitchClass(noteName: string): PitchClass {
    const noteNames = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    const index = noteNames.indexOf(noteName);
    if (index === -1) {
        throw new Error(`Invalid note name: ${noteName}`);
    }
    return index;
}

export function transposeChord(chord: Chord, interval: number): Chord {
    return chord.map(pitchClass => (pitchClass + interval));
}

export function invertVoicing(voicing: Voicing, direction: "up" | "down"): Voicing {
    if (direction === "up") {
        const newBass = voicing[0] + 12;
        const newVoicing = [...voicing.slice(1), newBass];
        return newVoicing;
    }
    else {
        const newTop = voicing[voicing.length - 1] - 12;
        const newVoicing = [newTop, ...voicing.slice(0, -1)];
        return newVoicing;
    }
}

function parseChordName(name: string): { root: string; quality: string } {
    const match = name.match(/^([A-G]#?)(.*)$/);
    if (!match) {
        throw new Error(`Invalid chord name: ${name}`);
    }
    return { root: match[1], quality: match[2] };
}

export function generateBasicChord(name: string): Chord {
    const { root, quality } = parseChordName(name);
    const rootPitchClass = getPitchClass(root);

    switch (quality) {
        case "":
            return transposeChord([0, 4, 7], rootPitchClass); // Major triad
        case "m":
            return transposeChord([0, 3, 7], rootPitchClass); // Minor triad
        case "7":
            return transposeChord([0, 4, 7, 10], rootPitchClass); // Dominant seventh
        case "m7":
            return transposeChord([0, 3, 7, 10], rootPitchClass); // Minor seventh
        case "dim7":
            return transposeChord([0, 3, 6, 9], rootPitchClass); // Diminished seventh
        case "m7-5":
            return transposeChord([0, 3, 6, 10], rootPitchClass); // Half-diminished seventh
        default:
            throw new Error(`Unsupported chord quality: ${quality}`);
    }
}

export function nameChordWithVoicing(basicName: string, voicing: Voicing): string {
    const { root, quality } = parseChordName(basicName);
    const rootPitchClass = getPitchClass(root);
    const bassPitch = voicing[0];
    const bassPitchClass = bassPitch % 12;
    if (bassPitchClass !== rootPitchClass) {
        return `${basicName}/${getNoteName(bassPitchClass)}`;
    }
    return basicName;
}