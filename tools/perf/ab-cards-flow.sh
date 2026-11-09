#!/bin/bash
# GD6: full-flow gate, preview-5 before vs after merging the card design. Usage: bash tools/perf/ab-cards-flow.sh [N=10] ["1 4"]
cd "$(dirname "$0")/../.."
N=${1:-10}; CPUS=${2:-"1 4"}; OUT=tools/perf/results/gd6/cards; rm -f $OUT/flow-*.jsonl
node tools/perf/flow.cjs --target map-surroundings-preview-5.html --cpu 1 --label warmup --stop gate --reps 1 >/dev/null 2>&1
for CPU in $CPUS; do for i in $(seq 1 $N); do
  if [ $((i % 2)) -eq 1 ]; then O="before after"; else O="after before"; fi
  for V in $O; do
    if [ $V = before ]; then T=map-surroundings-gd6tmp-before.html; else T=map-surroundings-preview-5.html; fi
    echo "== x$CPU rep $i $V $(date +%T)"
    node tools/perf/flow.cjs --target $T --cpu $CPU --label cf-$V-x$CPU --out $OUT/flow-$V-x$CPU.jsonl --reps 1 2>&1 | grep -E "enter-map|FATAL"
  done
done; done; echo CFDONE
