#!/bin/bash
# A/B batch: preview-4 (baseline) vs preview-5 (candidate), interleaved, fresh browser each run. Usage: bash tools/perf/ab-batch.sh [N=10] [outdir=tools/perf/results/gd1] [cpus="1 4"]
cd "$(dirname "$0")/../.."
N=${1:-10}; OUT=${2:-tools/perf/results/gd1}; CPUS=${3:-"1 4"}; mkdir -p $OUT
node tools/perf/flow.cjs --target map-surroundings-preview-5.html --cpu 1 --label warmup --stop gate --reps 1 >/dev/null 2>&1
for CPU in $CPUS; do
  for i in $(seq 1 $N); do
    for T in 4 5; do
      echo "== x$CPU rep $i preview-$T $(date +%T)"
      node tools/perf/flow.cjs --target map-surroundings-preview-$T.html --cpu $CPU --label ab-p$T-x$CPU --out $OUT/ab-p$T-x$CPU.jsonl --reps 1 2>&1 | grep -E "enter-map|FATAL"
    done
  done
done
echo ABBATCH_DONE
