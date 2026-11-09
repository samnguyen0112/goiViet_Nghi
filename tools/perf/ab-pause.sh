#!/bin/bash
# GD4 what-if: raster tick paused while the camera moves (variant pause) vs base, interleaved sessions.
# usage: tools/perf/ab-pause.sh <pairs> <cpu>
cd "$(dirname "$0")/../.."
N=${1:-4}; CPU=${2:-4}
for i in $(seq 1 $N); do
  if [ $((i % 2)) -eq 1 ]; then ORDER="base pause"; else ORDER="pause base"; fi
  for v in $ORDER; do
    node tools/perf/profile-interaction.cjs --target map-surroundings-preview-5.html --cpu $CPU --variant $v --label pause-$v-x$CPU-$i > /dev/null 2>&1 && echo "done $v $i"
  done
done
echo ALLDONE
