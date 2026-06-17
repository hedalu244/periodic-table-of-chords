import { ArpeggioParams, ArpeggioType } from "./ChordPlayer";
import { getElementById } from "./dom";

const ARPEGGIO_TYPES: ArpeggioType[] = [
	"none",
	"up-once",
	"down-once",
	"up-loop",
	"down-loop",
];

function isArpeggioType(value: string): value is ArpeggioType {
	return ARPEGGIO_TYPES.includes(value as ArpeggioType);
}

function getSelectedArpeggioType(): ArpeggioType {
	const typeElement = document.querySelector<HTMLInputElement>(
		'input[name="arpeggio-type"]:checked'
	);
	if (!typeElement) {
		throw new Error("arpeggio type is not selected");
	}

	const type = typeElement.value;
	if (!isArpeggioType(type)) {
		throw new Error("invalid arpeggio type: " + type);
	}
	return type;
}

export function getArpeggioSettings(): ArpeggioParams {
	const offsetInput = getElementById("input-arpeggio-offset-ms", HTMLInputElement);
	const noteOffsetMs = Number(offsetInput.value);

	if (!Number.isFinite(noteOffsetMs) || noteOffsetMs < 0) {
		throw new Error("arpeggio offset must be a non-negative number");
	}

	return {
		type: getSelectedArpeggioType(),
		noteOffsetMs: noteOffsetMs,
	};
}

