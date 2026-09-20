# dispatch: typescript.bryanchasko.com vs ts50 course split

for: the team picking up the course site. from: rocm-aibox ops, 2026-09-19.
all claims below verified live (AWS + S3 versions + git), not inferred.

## the diff

|                                 | typescript.bryanchasko.com (live now)                                           | ts50 course (should be separate)                                               |
| ------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| serves from                     | CloudFront E2E9BSL5RVN6DI (aerospaceug-admin) -> S3 bryanchasko.com/typescript/ | bryanchasko.com/ts50/ (main site)                                              |
| content now                     | 240-byte meta-refresh redirect to /ts50/                                        | TS50 Patriots Edition: TS taught with football, 14 modules, Nova Q&A coach     |
| content before Sep 17 07:12 UTC | the real 14KB course landing (hugo build, sign-in gate, coach)                  | same page family (canonical said /typescript/)                                 |
| video backend                   | S3 `_assets/favorite-typescript-videos/` frame JPGs feed the main site library  | 140 verified bootcamp videos, 120/120 transcribe jobs done, 105 S3 transcripts |

## timeline (S3 versions, bucket versioned)

- Sep 7: course landing live (~14KB index, 105 versions follow).
- Sep 17 00:33 UTC: delete markers on index/css/js (rotation).
- Sep 17 06:49 UTC: last good 14KB page (version fN5fiyYQlBQJGmdo1fvUB_TzChd3z3vv).
- Sep 17 07:12 UTC: replaced by 240-byte redirect; ~30 same-day deploys after.
  actor unknown (same unknown-actor pattern as other Sep 17 activity).

## what is NOT lost

- slide decks: in `websites/bryan-chasko-com` git history ("video-narrative
  slides for narrowing and generics decks", "5-slide survival run, 22 slides").
- course library: `content/favorite-typescript-videos/` + 12 narrative batches
  (slots 099-133) landing now; `_assets/` frames in S3.
- video pipeline outputs: 140/140 verified covered (105 S3 transcripts +
  51 local narrative dirs); see video-transcripts-batch-report.md.
- every S3 version retained: rollback = put back version
  fN5fiyYQlBQJGmdo1fvUB_TzChd3z3vv + CloudFront invalidation.

## open questions for the team (do not guess)

1. what builds/deploys the /typescript/ prefix? (no buildspec found in the
   typescript-understanding checkout; the 3 shipped files match the site
   repo's public/typescript/ coach-app bundle, but the redirect index does not)
2. where did the password gate ("typescript") live? no htpasswd/basic-auth in
   either repo; rewrite-function comment mentions signin (code not yet pulled).
3. who ran the Sep 17 deploy loop, and was the redirect intentional or a
   deploy-script default winning a race?
4. junk checkout `~/code/typescript-understanding` (empty, remote points at
   ROCm-AIBox-root): delete or repoint?
5. route target for narratives is s3vectors, NOT qdrant (owner-confirmed).
