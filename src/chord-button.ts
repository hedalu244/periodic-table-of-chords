import { TorusChordRow } from "./chord-table";
import { projectTorusPoint, TORUS_DEGREE, TorusViewState } from "./torus-utils";

interface RenderChordButtonParams {
    fragment: DocumentFragment;
    chordRow: TorusChordRow;
    viewState: TorusViewState;
    activeChordId: string | null;
    onChordClick: (chordId: string) => Promise<void>;
}

const TILE_DEGREE_OFFSETS = [-TORUS_DEGREE, 0, TORUS_DEGREE];
const CHORD_BUTTON_WIDTH_PX = 52;
const CHORD_BUTTON_HEIGHT_PX = 28;

function isChordButtonVisible(point: { x: number; y: number; }, viewState: TorusViewState): boolean {
    const halfWidth = CHORD_BUTTON_WIDTH_PX / 2;
    const halfHeight = CHORD_BUTTON_HEIGHT_PX / 2;
    return !(
        point.x + halfWidth < 0
        || point.x - halfWidth > viewState.width
        || point.y + halfHeight < 0
        || point.y - halfHeight > viewState.height
    );
}

function isSameChord(chordId1: string | null, chordId2: string | null): boolean {
    if (chordId1 === null || chordId2 === null) {
        return false;
    }

    const T_group = ["cdim7", "d#dim7", "f#dim7", "adim7"];
    const D_group = ["c#dim7", "edim7", "gdim7", "a#dim7"];
    const S_group = ["ddim7", "fdim7", "g#dim7", "bdim7"];

    if (T_group.includes(chordId1) && T_group.includes(chordId2) || 
        D_group.includes(chordId1) && D_group.includes(chordId2) ||
        S_group.includes(chordId1) && S_group.includes(chordId2)) {
        return true;
    }

    return chordId1 === chordId2;
}

function createChordButton(
    chord: TorusChordRow,
    x: number,
    y: number,
    activeChordId: string | null,
    onChordClick: (chordId: string) => Promise<void>,
): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = isSameChord(activeChordId, chord.id) ? "torus-chord active" : "torus-chord";
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.textContent = chord.name;
    button.dataset.chordId = chord.id;
    button.style.background = `linear-gradient(to right, ${chord.color1} ${chord.rate}%, ${chord.color2} ${chord.rate}%)`;
    button.addEventListener("click", () => {
        void onChordClick(chord.id);
    });
    return button;
}

export function renderChordButton(params: RenderChordButtonParams): void {
    const chord = params.chordRow;

    for (const tileOffsetX of TILE_DEGREE_OFFSETS) {
        for (const tileOffsetY of TILE_DEGREE_OFFSETS) {
            const point = projectTorusPoint(
                chord.xDeg + tileOffsetX,
                chord.yDeg + tileOffsetY,
                params.viewState,
            );
            if (!isChordButtonVisible(point, params.viewState)) {
                continue;
            }
            params.fragment.appendChild(
                createChordButton(chord, point.x, point.y, params.activeChordId, params.onChordClick)
            );
        }
    }
}
