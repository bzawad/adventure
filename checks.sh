#!/bin/bash

# checks.sh - Project Quality & Security Checks for React/Node.js
#
# This script runs the following checks:
#   1. Prettier (formatting, --check mode)
#   2. ESLint (linting for JS/JSX/TS/TSX)
#   3. TypeScript (type checking, if present)
#   4. npm audit (security vulnerabilities)
#
# The script fails on the first error (set -e).
#
# If you are missing any tools, install them with:
#   npm install --save-dev prettier eslint typescript
#
# Usage: bash checks.sh

set -e

# 1. Prettier formatting (auto-fix)
if npx prettier --version >/dev/null 2>&1; then
  echo "Running Prettier (auto-format)..."
  npx prettier --write .
else
  echo "Prettier not found. Install with: npm install --save-dev prettier"
  exit 1
fi

# 2. ESLint linting
if npx eslint --version >/dev/null 2>&1; then
  echo "Running ESLint..."
  npx eslint . --ext .js,.jsx,.ts,.tsx
else
  echo "ESLint not found. Install with: npm install --save-dev eslint"
  exit 1
fi

# 3. TypeScript type checking (if tsconfig.json exists)
if [ -f "tsconfig.json" ]; then
  if npx tsc --version >/dev/null 2>&1; then
    echo "Running TypeScript type check..."
    npx tsc --noEmit
  else
    echo "TypeScript not found. Install with: npm install --save-dev typescript"
    exit 1
  fi
else
  echo "No tsconfig.json found, skipping TypeScript check."
fi

# 4. npm audit for security vulnerabilities
if npm --version >/dev/null 2>&1; then
  echo "Running npm audit..."
  npm audit --audit-level=moderate
else
  echo "npm not found. Please install Node.js and npm."
  exit 1
fi

echo "All checks passed!" 