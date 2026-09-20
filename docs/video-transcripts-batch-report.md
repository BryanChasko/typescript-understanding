# video-transcripts batch report — typescript bootcamp (2026-09-19)

all-local transcription + vision + narrative backlog for the 140-video
verified bootcamp list. cloud transcribe crunch is over; everything below
ran on rocm-aibox, zero Bedrock cost.

## coverage

- verified list: 140 videos (`video-transcripts/typescript-bootcamp/verified-videos.txt`)
- amazon transcribe (crunch, closed): 120/120 jobs COMPLETED, 105 transcript
  outputs in `s3://dekawowow-media-946179428633-us-west-2/typescript-bootcamp-transcripts/`
- local backlog (verified minus local-done minus cloud-covered): 32 videos,
  **32/32 narratives complete** (`typescript-bootcamp/local-queue.tsv`)
- local dirs total: 52, of which 51 carry narratives (1 in flight)
- s3 audio cache: 17 mp3s in `typescript-bootcamp-audio/` (used as pull-through source)

## per-video pipeline (worker: `video-transcripts/bin/run-local-batch.py`)

1. yt-dlp mp4 (android client; DASH `bestvideo+bestaudio` merge fallback +
   explicit node JS runtime) with partial-download validation
2. mp3: S3 pull-through first, ffmpeg extract fallback
3. transcript: docker whisper-small on GPU (plain env — allocator overrides
   were found to poison runs), `--device cpu --model tiny` fallback under 90 min audio
4. frames: 1/min, cap 80, 768px
5. vision: ollama minicpm-v captions, serial, one frame per gpu_lock hold
6. combined.md (captions + overlapping transcript window)
7. narrative: chunked local qwen3:8b map-reduce
8. post: sibling `tighten.py` transcript pass, `transcripts/metadata.json` +
   `status.json`, best-effort `route-narrative.py`, mp4 deleted to reclaim disk

## gpu sharing (12GB rx 6700 xt)

all GPU stages (recipe SDXL renders + whisper + captions + narrative calls)
serialize on the valkey `:16379` gpu_lock with unload + semantic-idle gating
(ComfyUI queue empty + no resident ollama models). rocm-smi readings are
unreliable in low-power state — never gate on them.

## storage

- `typescript-bootcamp/`: 14G -> 4.3G (finished mp4/mp3 removed; narratives,
  transcripts, frames, mp3s kept; mp3s also in S3)
- idle model serves stopped to free VRAM: hs-stt-whisper, instella-vl,
  hs-tts-kokoro (systemd; restart after all backlogs drain)

## open / deferred

- narrative tighten via sibling script truncates past 1200 tokens: needs a
  chunked variant before narratives count as tightened
- qdrant routing: no local qdrant on this box (`route-narrative.py` exits
  0-skipped); metadata files are staged for backfill
- stopped serves (above) still down at time of writing
