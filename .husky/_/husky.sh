#!/bin/sh

if [ -z "$husky_skip_init" ]; then
  if [ "$HUSKY" = "0" ]; then
    exit 0
  fi

  export husky_skip_init=1
  sh "$0" "$@"
  exit $?
fi

if [ -n "$HUSKY_DEBUG" ]; then
  echo "husky:debug $0 $*"
fi

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  cat <<'EOF'
Usage: .husky/_/husky.sh [--help] <file>

Options:
  --help, -h   Show this help
EOF
  exit 0
fi

shift

if [ -f "$1" ]; then
  sh "$1" "$@"
else
  echo "husky: $1 not found (see husky.sh --help)"
fi
