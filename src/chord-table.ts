import { Chord, generateBasicChord, getNoteName } from "./chord-utils";

export interface TorusChordRow {
    id: string;
    xDeg: number;
    yDeg: number;
    name: string;
    chord: Chord;

    color1: string;
    color2: string;
    rate: number;
}

const T_color = "#13adb0";
const D_color = "#6e3196";
const S_color = "#d27700";

export const RAW_CHORD_TABLE: TorusChordRow[] = [
    ...generateDiminishedSeventhChords(),
    ...generateHalfdiminishedChords(),
    ...generateMinorTriads(),
    ...generateMinorSeventhChords(),
    ...generateMajorTriads(),
    ...generateDominantSeventhChords(),
];

function generateDiminishedSeventhChords(): TorusChordRow[] {
    const chordTable: TorusChordRow[] = [];
    for (let i = 0; i < 12; i += 1) {
        const chordName = `${getNoteName(i * 7)}dim7`;
        const chordId = chordName.toLowerCase();


        const chord = generateBasicChord(chordName);
        chordTable.push({
            id: chordId,
            xDeg: i * 120,
            yDeg: i * -30,
            name: chordName,
            chord: chord,
            color1: [T_color, D_color, S_color][i % 3],
            color2: [T_color, D_color, S_color][i % 3],
            rate: 100

        });
    }
    return chordTable;
}

function generateHalfdiminishedChords(): TorusChordRow[] {
    const chordTable: TorusChordRow[] = [];
    for (let i = 0; i < 12; i += 1) {
        const chordName = `${getNoteName(i * 7)}m7-5`;
        const chordId = chordName.toLowerCase();


        const chord = generateBasicChord(chordName);
        chordTable.push({
            id: chordId,
            xDeg: i * 120 + 30,
            yDeg: i * -30 - 52.5,
            name: chordName,
            chord: chord,
            color1: [T_color, D_color, S_color][i % 3],
            color2: [D_color, S_color, T_color][i % 3],
            rate: 75
        });
    }
    return chordTable;
}

function generateMinorTriads(): TorusChordRow[] {
    const chordTable: TorusChordRow[] = [];
    for (let i = 0; i < 12; i += 1) {
        const chordName = `${getNoteName(i * 7)}m`;
        const chordId = chordName.toLowerCase();

        const chord = generateBasicChord(chordName);
        chordTable.push({
            id: chordId,
            xDeg: i * 120 + 45,
            yDeg: i * -30 - 78.75,
            name: chordName,
            chord: chord,
            color1: [T_color, D_color, S_color][i % 3],
            color2: [D_color, S_color, T_color][i % 3],
            rate: 67
        });
    }
    return chordTable;
}

function generateMinorSeventhChords(): TorusChordRow[] {
    const chordTable: TorusChordRow[] = [];
    for (let i = 0; i < 12; i += 1) {
        const chordName = `${getNoteName(i * 7)}m7`;
        const chordId = chordName.toLowerCase();

        const chord = generateBasicChord(chordName);
        chordTable.push({
            id: chordId,
            xDeg: i * 120 + 60,
            yDeg: i * -30 - 105,
            name: chordName,
            chord: chord,
            color1: [T_color, D_color, S_color][i % 3],
            color2: [D_color, S_color, T_color][i % 3],
            rate: 50
        });
    }
    return chordTable;
}

function generateMajorTriads(): TorusChordRow[] {
    const chordTable: TorusChordRow[] = [];
    for (let i = 0; i < 12; i += 1) {
        const chordName = `${getNoteName(i * 7)}`;
        const chordId = chordName.toLowerCase();

        const chord = generateBasicChord(chordName);
        chordTable.push({
            id: chordId,
            xDeg: i * 120 + 75,
            yDeg: i * -30 - 176.25,
            name: chordName,
            chord: chord,
            color1: [T_color, D_color, S_color][i % 3],
            color2: [D_color, S_color, T_color][i % 3],
            rate: 33
        });
    }
    return chordTable;
}

function generateDominantSeventhChords(): TorusChordRow[] {
    const chordTable: TorusChordRow[] = [];
    for (let i = 0; i < 12; i += 1) {
        const chordName = `${getNoteName(i * 7)}7`;
        const chordId = chordName.toLowerCase();

        const chord = generateBasicChord(chordName);
        chordTable.push({
            id: chordId,
            xDeg: i * 120 + 90,
            yDeg: i * -30 - 157.5,
            name: chordName,
            chord: chord,
            color1: [T_color, D_color, S_color][i % 3],
            color2: [D_color, S_color, T_color][i % 3],
            rate: 25
        });
    }
    return chordTable;
}