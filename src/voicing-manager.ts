import { getArpeggioSettings } from "./arpeggio-controls";
import { AudioBackend } from "./audio-backend";
import { Chord, ChordPlayer, Voicing } from "./chord-player";
import { decideVoicing, invertVoicing } from "./voicing";

export class VoicingManager {
    private currentVoicing: Voicing | null = null;
    private isAudioReady = false;
    private readonly backend = new AudioBackend();
    private readonly player = new ChordPlayer(this.backend);

    replayActiveVoicing(): void {
        if (this.currentVoicing === null) {
            return;
        }
        this.player.play(this.currentVoicing, getArpeggioSettings());
    }

    async shiftActiveVoicing(direction: "up" | "down"): Promise<void> {
        if (this.currentVoicing === null) {
            return;
        }
        await this.prepareAudio();
        const nextVoicing = invertVoicing(this.currentVoicing, direction);
        this.currentVoicing = nextVoicing;
        this.player.play(nextVoicing, getArpeggioSettings());
    }

    async playChord(chord: Chord): Promise<void> {
        await this.prepareAudio();
        const nextVoicing = decideVoicing(chord, this.currentVoicing ?? undefined);
        this.currentVoicing = nextVoicing;
        this.player.play(nextVoicing, getArpeggioSettings());
    }

    stopChord(): void {
        this.player.stop();
        this.currentVoicing = null;
    }

    private async prepareAudio(): Promise<void> {
        if (this.isAudioReady) {
            await this.backend.resume();
            return;
        }
        await this.backend.initialize();
        await this.backend.resume();
        this.isAudioReady = true;
    }
}
