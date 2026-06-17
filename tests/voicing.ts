import {
	assertEqual,
	assertThrows,
	TestCase,
	runTestCases,
} from "./testRunner";
import { decideVoicing } from "../src/voicing";

function assertArrayEqual(actual: number[], expected: number[], message: string): void {
	assertEqual(actual.length, expected.length, message + " length mismatch");
	for (let i = 0; i < actual.length; i += 1) {
		assertEqual(actual[i], expected[i], message + " at index " + String(i));
	}
}

export const allTests: TestCase[] = [
	{
		name: "decideVoicing uses default root octave when previous is undefined",
		run: () => {
			const chord = [9, 13, 16, 20];
			const actual = decideVoicing(chord, undefined);
			assertArrayEqual(actual, [57, 61, 64, 68], "default voicing must be root position in octave 4");
		},
	},
	{
		name: "decideVoicing picks the nearest range from previous voicing",
		run: () => {
			const previous = [57, 61, 64, 68];
			const nextChord = [9, 12, 16];
			const actual = decideVoicing(nextChord, previous);
			assertArrayEqual(actual, [57, 60, 64], "nearest voicing should keep bass and top as close as possible");
		},
	},
	{
		name: "decideVoicing resolves tritone bass tie by deterministic lower bass",
		run: () => {
			const previous = [60, 64];
			const nextChord = [6, 10];
			const actual = decideVoicing(nextChord, previous);
			assertArrayEqual(actual, [54, 58], "tritone tie should pick the lower bass option");
		},
	},
	{
		name: "decideVoicing throws on empty chord",
		run: () => {
			assertThrows(() => {
				decideVoicing([], undefined);
			}, "empty chord must throw");
		},
	},
	{
		name: "decideVoicing throws on empty previous voicing",
		run: () => {
			assertThrows(() => {
				decideVoicing([0, 4, 7], []);
			}, "empty previous voicing must throw");
		},
	},
];

export async function runAllTests(): Promise<void> {
	await runTestCases(allTests);
}
