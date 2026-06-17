export function getElementById<T extends HTMLElement>(
    id: string,
    constructor: { new(): T },
): T {
    const el = document.getElementById(id);
    if (el === null) {
        throw new Error(`Element with id "${id}" not found.`);
    }
    if (!(el instanceof constructor)) {
        throw new Error(`Element with id "${id}" is not a ${constructor.name}.`);
    }
    return el;
}
