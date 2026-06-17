import { PitchClass } from "./chord-utils";

export const T_color = "#13adb0";
export const D_color = "#6e3196";
export const S_color = "#d27700";

export const T_color_light = "#72fdff";
export const D_color_light = "#d88bff";
export const S_color_light = "#ffc69b";

export const T_color_dark = "#076e70";
export const D_color_dark = "#4d2163";
export const S_color_dark = "#aa4f0a";

export type ColorScheme = {
    activePitch: string;
    activePitchClass: string;
    idle: string;
};

export function getColorScheme(pitchClass: PitchClass, isBlack: boolean): ColorScheme {
    const axis = pitchClass % 3; 
    return {
        activePitch: [T_color_light, D_color_light, S_color_light][axis], 
        activePitchClass: [T_color_dark, D_color_dark, S_color_dark][axis],
        idle: isBlack ? "#222222" : "#555555",
    }
}