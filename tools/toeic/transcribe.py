"""Listening audio -> timed transcripts (speech-to-text, offline, on this machine).

    python tools/toeic/transcribe.py --out build/toeic [--sets 1 2 3] [--parts 1 2 3 4] [--model small.en]

Writes build/toeic/sN/transcript/partM.json = [{ start, end, text }, ...] (seconds). These are used (privately, never committed) to
cut each Part's audio into one stretch per question/conversation/talk and to write the "how to think" notes. Needs:
pip install faster-whisper   (the model is downloaded the first time).
"""
import argparse
import json
import time
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='build/toeic')
    ap.add_argument('--sets', type=int, nargs='*', default=[1, 2, 3])
    ap.add_argument('--parts', type=int, nargs='*', default=[1, 2, 3, 4])
    ap.add_argument('--model', default='small.en')
    ap.add_argument('--force', action='store_true', help='redo files that already have a transcript')
    a = ap.parse_args()
    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device='cpu', compute_type='int8', cpu_threads=12)
    out = Path(a.out)
    for s in a.sets:
        for p in a.parts:
            src = out / ('s%d' % s) / 'audio' / ('part%d.mp3' % p)
            dst = out / ('s%d' % s) / 'transcript' / ('part%d.json' % p)
            if dst.exists() and not a.force:
                print('skip', dst)
                continue
            t = time.time()
            # looser thresholds: with the defaults whisper silently drops quiet or fast stretches (a whole 25 s announcement went missing once)
            segs, info = model.transcribe(str(src), language='en', beam_size=5, vad_filter=False, condition_on_previous_text=False,
                                          no_speech_threshold=0.95, log_prob_threshold=-2.5, compression_ratio_threshold=3.5)
            rows = [{'start': round(x.start, 2), 'end': round(x.end, 2), 'text': x.text.strip()} for x in segs]
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text(json.dumps(rows, ensure_ascii=False, indent=0), encoding='utf-8')
            print('set %d part %d: %d segments, audio %.0fs, took %.0fs' % (s, p, len(rows), info.duration, time.time() - t), flush=True)


if __name__ == '__main__':
    main()
