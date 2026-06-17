
import {
	TestCase,
	runTestCases,
} from "./testRunner";

export const allTests: TestCase[] = [
];

export async function runAllTests(): Promise<void> {
	await runTestCases(allTests);
}
