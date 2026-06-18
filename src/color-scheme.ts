import { PitchClass } from "./chord-utils";

export const T_color = "#13adb0";
export const D_color = "#6e3196";
export const S_color = "#d27700";

export const T_color_light = "#b8eff0";
export const D_color_light = "#e6c8f5";
export const S_color_light = "#eed5c1";

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
        activePitch: [T_color, D_color, S_color][axis],
        activePitchClass: [T_color_light, D_color_light, S_color_light][axis], 
        idle: isBlack ? "#cccccc" : "#efefef",
    }
}