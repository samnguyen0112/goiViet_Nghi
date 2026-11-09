#!/bin/bash
# Degraded rendering paths on the baseline: software WebGL (SwiftShader) and WebGL unavailable, at 1x and 4x CPU.
cd "$(dirname "$0")/../.."
OUT=tools/perf/results/gd0
rm -f $OUT/deg-*.jsonl
echo "== worker fallback scenarios =="; node tools/perf/fallback.cjs --only worker-ctor-throws,worker-error-event 2>&1 | cut -c1-400
for G in swiftshader nowebgl; do for C in 1 4; do
  echo "== $G x$C $(date +%T) =="; node tools/perf/flow.cjs --target map-surroundings-preview-4.html --cpu $C --gpu $G --reps 3 --label p4-$G-x$C --out $OUT/deg-$G-x$C.jsonl 2>&1 | grep -E "enter-map|FATAL|opening:"
done; done
echo DEGRADED_DONE
