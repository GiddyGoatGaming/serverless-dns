#!/bin/bash

set -e

wk="${1}"
mm="${2}"
yyyy="${3}"

# Define variables
burl="https://cfstore.rethinkdns.com/blocklists"
dir="bc"
codec="u6"
f="basicconfig.json"
f2="filetag.json"
tmpdir=$(mktemp -d)
out="${tmpdir}/${codec}-${f}"
out2="${tmpdir}/${codec}-${f2}"

# Get current timestamp
now=$(date -u +"%s.%3N")

# Get week and month
wkdef=$(date -u -d "$(date -d "01/01/${yyyy}") +$((10#${wk}-1)) week" +"%V")
mmdef=$(date -u -d "$(date -d "01/${mm}/${yyyy}") +%m")
fimmdef=${mmdef#0}

# Set defaults
wk="${wk:-${wkdef}}"
mm="${mm:-${mmdef}}"
yyyy="${yyyy:-$(date -u +"%Y")}"

# Loop through weeks
for i in {0..4}; do
  echo "x=== pre.sh: $i try ${yyyy}/${mm}-${wk} at ${now} from ${tmpdir}"

  # Check if the file/symlink exists
  if [ -f "${out}" ] || [ -L "${out}" ]; then
    echo "=x== pre.sh: no op"
    exit 0
  else
    # Download basicconfig.json
    wget -q "${burl}/${yyyy}/${dir}/${mm}-${wk}/${codec}/${f}" -O "${out}"
    wcode=$?

    if [ $wcode -eq 0 ]; then
      # Extract timestamp from basicconfig.json
      fulltimestamp=$(jq -r '.timestamp' "${out}")

      if [ -z "${fulltimestamp}" ]; then
        echo "==x= pre.sh: $i filetag not found"
        exit 1
      else
        echo "==x= pre.sh: $i ok $wcode; filetag? ${fulltimestamp}"

        # Download filetag.json
        wget -q "${burl}/${fulltimestamp}/${codec}/${f2}" -O "${out2}"
        wcode2=$?

        if [ $wcode2 -eq 0 ]; then
          echo "===x pre.sh: $i filetag ok $wcode2"
          exit 0
        else
          echo "===x pre.sh: $i not ok $wcode2"
          exit 1
        fi
      fi
    else
      # Remove blank files on errors
      rm -f "${out}"
      echo "==x= pre.sh: $i not ok $wcode"
    fi
  fi

  # Get previous week and month
  wk=$(date -u -d "$(date -d "01/01/${yyyy}") +$((10#${wk}-1)) week - 7 days" +"%V")
  mm=$(date -u -d "$(date -d "01/${mm}/${yyyy}") -1 month +%m")
  yyyy=$(date -u -d "$(date -d "01/${mm}/${yyyy}") +%Y")
done

# Remove temporary directory
trap 'rm -rf "${tmpdir}"' EXIT
exit 1
