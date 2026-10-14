#!/usr/bin/env bash
# Checks a pull request that publishes packages: it only adds files, and only a package's owners
# publish new versions of it. `vex registry verify` checks the files themselves afterwards.
#
# Usage: scripts/check-pull-request.sh BASE_COMMIT GITHUB_LOGIN
set -euo pipefail

base=$1
author=$2

published=$(git diff --name-only "$base"...HEAD -- index archives)
if [ -z "$published" ]; then
  echo "This pull request publishes nothing, so there is nothing to check here."
  exit 0
fi

failed=0
fail() {
  echo "error: $*" >&2
  failed=1
}

# A publishing pull request changes nothing but index/, archives/ and owners/, so a reviewer
# can trust that it does not also change how the registry is checked or served.
other=$(git diff --name-only "$base"...HEAD | grep -vE '^(index|archives|owners)/' || true)
if [ -n "$other" ]; then
  fail "a pull request that publishes packages may change only index/, archives/ and owners/. It also changes: $(echo $other)"
fi

# A published version never changes: archives are only added, and index lines only appended.
changed_archives=$(git diff --name-only --diff-filter=MDRT "$base"...HEAD -- archives)
if [ -n "$changed_archives" ]; then
  fail "these archives are changed or removed, but a published archive never changes: $(echo $changed_archives)"
fi
removed_lines=$(git diff -U0 "$base"...HEAD -- index | grep -E '^-[^-]' || true)
if [ -n "$removed_lines" ]; then
  fail "lines are removed from the index, but index lines are only ever added:"$'\n'"$removed_lines"
fi

# Owners: an existing package may be published only by a login in its owners file on the base
# branch. A new package must add its owners file, naming the author.
for index_file in $(git diff --name-only "$base"...HEAD -- index); do
  name=$(basename "$index_file" .jsonl)
  if git cat-file -e "$base:owners/$name" 2>/dev/null; then
    if ! git show "$base:owners/$name" | grep -qxF "$author"; then
      fail "@$author is not an owner of \`$name\`. Its owners are: $(git show "$base:owners/$name" | tr '\n' ' ')"
    fi
    if ! git diff --quiet "$base"...HEAD -- "owners/$name"; then
      fail "owners/$name changes in a publishing pull request. Change owners in a separate one, which a maintainer reviews"
    fi
  else
    if [ ! -f "owners/$name" ] || ! grep -qxF "$author" "owners/$name"; then
      fail "\`$name\` is a new package, so this pull request must add owners/$name with your login, $author, on a line of its own"
    fi
  fi
done

if [ "$failed" -ne 0 ]; then
  exit 1
fi
echo "ok: only new files and index lines, published by their owners"
