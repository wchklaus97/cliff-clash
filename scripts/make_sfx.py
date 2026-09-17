"""Generate original 16-bit WAV one-shots and a wind loop. No licensed samples."""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
DST = Path(__file__).resolve().parents[1] / "public" / "assets" / "sfx"


def write_wav(path: Path, samples: list[float], rate: int = RATE) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        packed = b"".join(
            struct.pack("<h", max(-32767, min(32767, int(s * 32767))))
            for s in samples
        )
        wav.writeframes(packed)


def env(i: int, n: int, attack: float = 0.01, release: float = 0.2) -> float:
    t = i / max(1, n - 1)
    a = min(1.0, t / attack) if attack > 0 else 1.0
    r = min(1.0, (1.0 - t) / release) if release > 0 else 1.0
    return a * r


def tone(freq: float, seconds: float, wave_kind: str = "square") -> list[float]:
    n = int(RATE * seconds)
    out: list[float] = []
    for i in range(n):
        phase = (i / RATE) * freq
        if wave_kind == "sine":
            s = math.sin(2 * math.pi * phase)
        elif wave_kind == "tri":
            s = 4 * abs(phase % 1 - 0.5) - 1
        elif wave_kind == "noise":
            s = random.uniform(-1, 1)
        else:
            s = 1.0 if (phase % 1) < 0.5 else -1.0
        out.append(s * env(i, n, 0.02, 0.35) * 0.35)
    return out


def mix(*parts: list[float]) -> list[float]:
    n = max(len(p) for p in parts)
    out = [0.0] * n
    for p in parts:
        for i, v in enumerate(p):
            out[i] += v
    peak = max(1e-6, max(abs(x) for x in out))
    return [x / peak * 0.9 for x in out]


def sweep(start: float, end: float, seconds: float) -> list[float]:
    n = int(RATE * seconds)
    out: list[float] = []
    for i in range(n):
        t = i / max(1, n - 1)
        f = start + (end - start) * t
        s = 1.0 if ((i / RATE) * f) % 1 < 0.5 else -1.0
        out.append(s * env(i, n, 0.01, 0.4) * 0.32)
    return out


def noise_hit(seconds: float, lowpass: int = 4) -> list[float]:
    n = int(RATE * seconds)
    acc = 0.0
    out: list[float] = []
    for i in range(n):
        acc = (acc * (lowpass - 1) + random.uniform(-1, 1)) / lowpass
        out.append(acc * env(i, n, 0.005, 0.5) * 0.6)
    return out


def wind_loop(seconds: float = 4.0) -> list[float]:
    n = int(RATE * seconds)
    out: list[float] = []
    acc = 0.0
    for i in range(n):
        acc = acc * 0.96 + random.uniform(-1, 1) * 0.04
        wobble = math.sin(2 * math.pi * i / RATE * 0.35) * 0.15
        out.append((acc + wobble) * 0.25)
    # fade edges so it loops
    fade = int(RATE * 0.15)
    for i in range(fade):
        out[i] *= i / fade
        out[-1 - i] *= i / fade
    return out


def chirp_voice(base: float, seconds: float = 0.55) -> list[float]:
    """Cute mascot shout, not speech of a licensed character."""
    n = int(RATE * seconds)
    out: list[float] = []
    for i in range(n):
        t = i / RATE
        f = base * (1.15 if t < 0.18 else 0.92)
        s = math.sin(2 * math.pi * f * t) * 0.45
        s += math.sin(2 * math.pi * f * 2 * t) * 0.12
        out.append(s * env(i, n, 0.05, 0.35))
    return out


def theme_loop(seconds: float = 3.2) -> list[float]:
    notes = [392.0, 523.0, 587.0, 659.0, 784.0, 659.0, 523.0, 440.0]
    step = seconds / len(notes)
    parts: list[list[float]] = []
    t = 0.0
    for freq in notes:
        n = int(RATE * step)
        note: list[float] = []
        for i in range(n):
            s = math.sin(2 * math.pi * freq * (i / RATE)) * 0.22
            s += math.sin(2 * math.pi * freq * 2 * (i / RATE)) * 0.05
            note.append(s * env(i, n, 0.08, 0.35))
        pad = [0.0] * int(RATE * t)
        parts.append(pad + note)
        t += step
    return mix(*parts)


def main() -> None:
    random.seed(17)
    jobs = {
        "ui-click.wav": tone(880, 0.07, "sine"),
        "ui-play.wav": mix(tone(523, 0.12, "sine"), tone(784, 0.18, "sine"), tone(1046, 0.22, "sine")),
        "jump.wav": mix(sweep(240, 720, 0.14), tone(880, 0.08, "sine")),
        "land.wav": mix(noise_hit(0.1, 7), tone(160, 0.09, "sine")),
        "light.wav": mix(noise_hit(0.08, 4), tone(620, 0.07, "tri")),
        "heavy-charge.wav": mix(sweep(70, 210, 0.38), tone(90, 0.38, "sine")),
        "heavy-hit.wav": mix(
            noise_hit(0.24, 2),
            tone(80, 0.22, "sine"),
            sweep(340, 70, 0.2),
        ),
        "ko.wav": mix(sweep(480, 50, 0.6), noise_hit(0.45, 5), tone(98, 0.4, "sine")),
        "win.wav": mix(
            tone(523, 0.16, "sine"),
            tone(659, 0.2, "sine"),
            tone(784, 0.28, "sine"),
            tone(1046, 0.32, "sine"),
        ),
        "wind.wav": wind_loop(4.0),
        "theme.wav": theme_loop(3.4),
        "whoosh.wav": sweep(180, 880, 0.16),
        "voice-bun.wav": chirp_voice(420),
        "voice-mochi.wav": chirp_voice(280),
        "voice-bean.wav": chirp_voice(640),
    }
    for name, samples in jobs.items():
        dest = DST / name
        write_wav(dest, samples)
        print(f"wrote {dest} ({len(samples)} samples)")


if __name__ == "__main__":
    main()
