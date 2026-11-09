#!/bin/bash
# Experiment: does replacing :has(#introScreen.intro-hidden) with a body class cut style-recalc cost? (route rewrite; no site file changed)
cd "$(dirname "$0")/../.."
OUT=tools/perf/results/gd1; mkdir -p $OUT; rm -f $OUT/has-*.jsonl
N=${1:-5}; CPU=${2:-4}
for i in $(seq 1 $N); do for V in passthru has; do
  echo "== x$CPU rep $i $V $(date +%T)"; node tools/perf/flow.cjs --target map-surroundings-preview-5.html --cpu $CPU --variant $V --reps 1 --stop map-enter --label has-$V --out $OUT/has-$V-x$CPU.jsonl 2>&1 | grep -E "enter-map|FATAL"
done; done; echo HAS_DONE
