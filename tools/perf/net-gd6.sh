#!/bin/bash
# Gate load time under emulated networks, preview-4 vs preview-5 interleaved. Usage: bash tools/perf/net-batch.sh
cd "$(dirname "$0")/../.."; OUT=tools/perf/results/gd6; rm -f $OUT/net-*.jsonl
for cfg in "fast4g 5" "slow4g 3"; do set -- $cfg; NET=$1; N=$2
  for i in $(seq 1 $N); do for T in 4 5; do
    echo "== $NET rep $i p$T $(date +%T)"
    node tools/perf/flow.cjs --target map-surroundings-preview-$T.html --cpu 1 --net $NET --stop gate --reps 1 --label net-p$T-$NET --out $OUT/net-p$T-$NET.jsonl 2>&1 | grep -E "FATAL"
  done; done
done; echo NETDONE
