#!/bin/bash

# Script to push to a private GitHub repository
# This script helps you create and push to a private GitHub repo

echo "🚀 Setting up GitHub repository for Social Tweebs"
echo ""

# Get repository name
read -p "Enter repository name (default: social-tweebs-platform): " REPO_NAME
REPO_NAME=${REPO_NAME:-social-tweebs-platform}

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required!"
    exit 1
fi

echo ""
echo "📋 Next steps:"
echo ""
echo "1. Go to https://github.com/new"
echo "2. Repository name: $REPO_NAME"
echo "3. ✅ Make sure to select 'Private' repository"
echo "4. Don't initialize with README, .gitignore, or license (we already have them)"
echo "5. Click 'Create repository'"
echo ""
read -p "Press Enter after you've created the repository on GitHub..."

# Add remote
echo ""
echo "🔗 Adding GitHub remote..."
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your repository is now on GitHub at:"
echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "🔒 Make sure the repository is set to Private in GitHub settings if you haven't already."
