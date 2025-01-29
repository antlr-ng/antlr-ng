#!/bin/bash

dirs="src tests"
exts="ts json"

total_files=0
total=0
for ext in $exts; do
    files=`find $dirs -name \*.$ext | grep -v 'generated' | grep -v 'oci-typings' | wc -l`
    count=$(wc -l /dev/null `find $dirs -name \*.$ext | grep -v 'generated' | tail -1 | awk '{print $1}')

    echo "$ext:	$count LOC	$files files"
    total=$(($total + $count))
    total_files=$(($total_files + $files))
done
echo "Total LOC: $total"
echo "Total Files: $total_files"
