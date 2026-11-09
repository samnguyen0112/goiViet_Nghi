#!/bin/bash
# A/A noise batch: interleave preview-4 and its byte-identical copy preview-5, N reps each, at 1x then 4x CPU.
# Usage: bash tools/perf/aa-batch.sh [N=10]   (needs `node tools/perf/server.cjs` running on :8770)
cd "$(dirname "$0")/../.."
N=${1:-10}
OUT=tools/perf/results/gd0
echo "== warmup (discarded) =="; node tools/perf/flow.cjs --target map-surroundings-preview-4.html --cpu 1 --label warmup --stop gate --reps 1 >/dev/null 2>&1
for CPU in 1 4; do
  for i in $(seq 1 $N); do
    for T in 4 5; do
      echo "== cpu x$CPU rep $i preview-$T $(date +%T) =="
      node tools/perf/flow.cjs --target map-surroundings-preview-$T.html --cpu $CPU --label p$T-x$CPU --out $OUT/aa-p$T-x$CPU.jsonl --reps 1 2>&1 | grep -E "enter-map|FATAL"
    done
  done
done
echo AABATCH_DONE
