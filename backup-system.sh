#!/bin/bash

# HR Disciplinary System - Automated Backup Script
# Protects against accidental code deletion

BACKUP_DIR="$HOME/hr-system-backups"
PROJECT_DIR="/home/aiguy/projects/hr-disciplinary-system"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔄 Starting HR System Backup - $TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create timestamped backup
BACKUP_PATH="$BACKUP_DIR/hr-system-$TIMESTAMP"
echo "📁 Creating backup at: $BACKUP_PATH"

# Copy entire project (excluding node_modules, build files)
rsync -av \
  --exclude 'node_modules/' \
  --exclude '.firebase/' \
  --exclude 'dist/' \
  --exclude 'build/' \
  --exclude 'frontend/node_modules/' \
  --exclude 'functions/node_modules/' \
  --exclude 'functions/lib/' \
  --exclude 'frontend/test-results/' \
  --exclude '*.log' \
  --exclude '.env' \
  "$PROJECT_DIR/" "$BACKUP_PATH/"

# Create git commit if in git repo
cd "$PROJECT_DIR"
if [ -d ".git" ]; then
    echo "📝 Creating git commit..."
    git add .
    git commit -m "Backup: $TIMESTAMP - Automated system backup

🔄 System backup created
📁 Backup location: $BACKUP_PATH
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "⚠️  No changes to commit"
fi

# Keep only last 10 backups
echo "🧹 Cleaning old backups (keeping last 10)..."
ls -1t "$BACKUP_DIR" | tail -n +11 | xargs -I {} rm -rf "$BACKUP_DIR/{}"

echo "✅ Backup completed successfully!"
echo "📊 Backup statistics:"
du -sh "$BACKUP_PATH"
echo "📁 Total backups: $(ls -1 "$BACKUP_DIR" | wc -l)"
echo "💾 Backup directory: $BACKUP_DIR"