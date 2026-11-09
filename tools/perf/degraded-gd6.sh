#!/bin/bash
# GD6: degraded rendering paths on preview-5 (same matrix as GD0 degraded-batch.sh, which ran on preview-4).
cd "$(dirname "$0")/../.."
OUT=tools/perf/results/gd6; rm -f $OUT/deg-*.jsonl
for G in swiftshader nowebgl; do for C in 1 4; do
  echo "== $G x$C $(date +%T) =="; node tools/perf/flow.cjs --target map-surroundings-preview-5.html --cpu $C --gpu $G --reps 3 --label p5-$G-x$C --out $OUT/deg-$G-x$C.jsonl 2>&1 | grep -E "enter-map|FATAL|opening:"
done; done
echo DEGRADED_DONE
