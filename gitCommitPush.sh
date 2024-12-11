#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo "Error: No commit message provided."
  echo "Usage: ./gitcommitpush.sh 'Your commit message'"
  exit 1
fi

# Assign the first argument as the commit message
COMMIT_MSG=$1

# Name of the branch
BRANCH_NAME="updateSoumya"

# Git add, commit, and push
git checkout updateSoumya
git add .
git commit -m "$COMMIT_MSG"

# Check if the commit was successful
if [ $? -eq 0 ]; then
    echo "Successfully committed. Now pushing to branch $BRANCH_NAME..."
    git push origin $BRANCH_NAME
else
    echo "Commit failed. Please check the error message above."
fi
