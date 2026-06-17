export type TestCase = {
	name: string;
	run: () => void | Promise<void>;
};

export function assertTrue(value: boolean, message: string): void {
	if (!value) {
		throw new Error(message);
	}
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
	if (actual !== expected) {
		throw new Error(message + " (actual=" + String(actual) + ", expected=" + String(expected) + ")");
	}
}

export function assertThrows(action: () => void, message: string): void {
	let didThrow = false;
	try {
		action();
	} catch (_err) {
		didThrow = true;
	}
	assertTrue(didThrow, message);
}

export async function runTestCases(testCases: TestCase[]): Promise<void> {
	const failures: string[] = [];

	for (const t of testCases) {
		try {
			await t.run();
			console.log("[PASS] " + t.name);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			failures.push(t.name + ": " + message);
			console.error("[FAIL] " + t.name + " -> " + message);
		}
	}

	if (failures.length > 0) {
		throw new Error("tests failed (" + failures.length + ")\n" + failures.join("\n"));
	}
}