#!/bin/bash
# GD6 diagnostic: preview-5 vs the same page with the GD2 raster scheduler swapped back to -4, WebGL unavailable, interleaved.
cd "$(dirname "$0")/../.."; OUT=tools/perf/results/gd6; rm -f $OUT/gx-*.jsonl
N=${1:-6}
for i in $(seq 1 $N); do
  if [ $((i % 2)) -eq 1 ]; then O="preview-5 gd6tmp-orig"; else O="gd6tmp-orig preview-5"; fi
  for T in $O; do echo "== rep $i $T $(date +%T)"
    node tools/perf/flow.cjs --target map-surroundings-$T.html --cpu 4 --gpu real --reps 1 --label gx-$T --out $OUT/gx-$T.jsonl 2>&1 | grep -E "enter-map|FATAL"
  done
done; echo NSDONE
