import { Chord, Pitch, PitchClass, Voicing } from "./chord-player";

export const DEFAULT_ROOT_OCTAVE = 5;

function validateChord(chord: Chord): void {
	if (chord.length === 0) {
		throw new Error("chord must not be empty");
	}
	for (const pitchClass of chord) {
		if (!Number.isFinite(pitchClass)) {
			throw new Error("chord must contain finite pitch classes");
		}
	}
}

function validateVoicing(voicing: Voicing): void {
	if (voicing.length === 0) {
		throw new Error("voicing must not be empty");
	}
	for (const pitch of voicing) {
		if (!Number.isFinite(pitch)) {
			throw new Error("voicing must contain finite pitches");
		}
	}
}

function getMinPitch(voicing: Voicing): Pitch {
	return Math.min(...voicing);
}

function getMaxPitch(voicing: Voicing): Pitch {
	return Math.max(...voicing);
}

function getCycledPitchClasses(chord: Chord, inversionIndex: number): PitchClass[] {
	return [...chord.slice(inversionIndex), ...chord.slice(0, inversionIndex)];
}

function getNearestBassOctaves(bassPitchClass: PitchClass, previousBass: Pitch): Pitch[] {
	const octaveFloat = (previousBass - bassPitchClass) / 12;
	const lowerOctave = Math.floor(octaveFloat);
	const upperOctave = Math.ceil(octaveFloat);
	const lowerPitch = bassPitchClass + lowerOctave * 12;
	const upperPitch = bassPitchClass + upperOctave * 12;

	if (lowerPitch === upperPitch) {
		return [lowerPitch];
	}

	const lowerDistance = Math.abs(lowerPitch - previousBass);
	const upperDistance = Math.abs(upperPitch - previousBass);
	if (lowerDistance === upperDistance) {
		return [lowerPitch, upperPitch];
	}
	return lowerDistance < upperDistance ? [lowerPitch] : [upperPitch];
}

function buildClosePositionVoicing(chord: Chord, inversionIndex: number, bassPitch: Pitch): Voicing {
	const cycledPitchClasses = getCycledPitchClasses(chord, inversionIndex);
	const bassPitchClass = cycledPitchClasses[0];
	const baseOctave = Math.floor((bassPitch - bassPitchClass) / 12);
	const voicing: Voicing = [bassPitch];
	let previousPitch = bassPitch;

	for (const pitchClass of cycledPitchClasses.slice(1)) {
		let pitch = pitchClass + baseOctave * 12;
		while (pitch <= previousPitch) {
			pitch += 12;
		}
		voicing.push(pitch);
		previousPitch = pitch;
	}

	return voicing;
}

function scoreVoiceliading(candidate: Voicing, previousVoicing: Voicing): number {
	return Math.abs(getMinPitch(candidate) - getMinPitch(previousVoicing))
		+ Math.abs(getMaxPitch(candidate) - getMaxPitch(previousVoicing));
}

export function decideVoicing(chord: Chord, previousVoicing: Voicing | undefined): Voicing {
	validateChord(chord);

	if (previousVoicing === undefined) {
		const rootPitch = chord[0] + DEFAULT_ROOT_OCTAVE * 12;
		return buildClosePositionVoicing(chord, 0, rootPitch);
	}

	validateVoicing(previousVoicing);
	const previousBass = getMinPitch(previousVoicing);
	let best: Voicing | null = null;
    let minscore = Number.POSITIVE_INFINITY;

	for (let inversionIndex = 0; inversionIndex < chord.length; inversionIndex += 1) {
		const bassPitchClass = chord[inversionIndex];
		const bassOptions = getNearestBassOctaves(bassPitchClass, previousBass);

		for (const bassPitch of bassOptions) {
			const candidateVoicing = buildClosePositionVoicing(chord, inversionIndex, bassPitch);
			const score = scoreVoiceliading(candidateVoicing, previousVoicing);
			if (score < minscore) {
				minscore = score;
				best = candidateVoicing;
			}
		}
	}

	if (best === null) {
		throw new Error("failed to decide voicing");
	}

	return best;
}


export function invertVoicing(voicing: Voicing, direction: "up" | "down"): Voicing {
    validateVoicing(voicing);
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