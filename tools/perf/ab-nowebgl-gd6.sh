#!/bin/bash
# GD6: interleaved preview-4 vs preview-5 with WebGL unavailable (Canvas 2D path), to settle a possible enter-map regression seen at n=3.
cd "$(dirname "$0")/../.."; OUT=tools/perf/results/gd6; rm -f $OUT/nw-*.jsonl
N=${1:-6}; CPU=${2:-1}
for i in $(seq 1 $N); do
  if [ $((i % 2)) -eq 1 ]; then O="4 5"; else O="5 4"; fi
  for T in $O; do echo "== nowebgl x$CPU rep $i p$T $(date +%T)"
    node tools/perf/flow.cjs --target map-surroundings-preview-$T.html --cpu $CPU --gpu nowebgl --reps 1 --label nw-p$T-x$CPU --out $OUT/nw-p$T-x$CPU.jsonl 2>&1 | grep -E "enter-map|FATAL"
  done
done; echo NWDONE
