# video pipeline (typescript bootcamp transcription)

Canonical source for the local video worker. The live copy runs from
`~/video-transcripts/bin/run-local-batch.py` — edit here, then sync the
live copy (or symlink it) so the two never drift.

## what it does

Per video, end to end on this box (zero Bedrock cost outside embeddings):

1. yt-dlp mp4 pull with partial-download validation
2. mp3 via S3 pull-through, ffmpeg fallback
3. whisper transcript (docker whisper-small GPU, tiny-cpu fallback)
4. frames at 1/min (cap 80, 768px)
5. minicpm-v vision captions through the valkey `:16379` gpu_lock
6. combined.md (captions + overlapping transcript window)
7. qwen3:8b chunked map-reduce narrative
8. tighten pass, `transcripts/metadata.json` + `status.json`, narrative
   routing, mp4 deleted to reclaim disk

Data layout it expects under `~/video-transcripts/`:

- `typescript-bootcamp/verified-videos.txt` — 140-video verified list
- `typescript-bootcamp/local-queue.tsv` — local backlog queue
- `typescript-bootcamp/local-<id>/`, `cloud-<n>-<m>/` — per-video dirs
- `bin/run-synthesis-pipeline.py` + `tools/synthesis/` — cloud-crunch
  synthesis entrypoint (not yet versioned here; see below)

## routing (where narratives go)

The post step shells to the goose recipe's `route-narrative.py`
(`~/code/projects/goose-cli-video-transcription-recipe/scripts/`):

- `ROUTE_BACKEND=s3vectors` (default in this worker) — bedrock
  titan-embed-1024 into s3vectors `typescript-course/video-narratives`
  (us-east-1, account 946179428633). qdrant is NOT a target.
- `AWS_PROFILE` default `bryanchasko-kiro` (override per environment).
- `S3V_BUCKET` / `S3V_INDEX` / `S3V_REGION` / `S3V_EMBED_MODEL` override
  the vector destination when needed.

## syncing the live copy

```bash
cp video-pipeline/run-local-batch.py ~/video-transcripts/bin/run-local-batch.py
```

## not yet versioned

- `bin/run-synthesis-pipeline.py` + `tools/synthesis/` (cloud-crunch
  synthesis package) — review before bringing in; the entrypoint
  imports `synthesis.video_batch` and only runs with `tools/` on the path.
- GPU lock holder, whisper/vision model serves, S3 buckets/queues.
