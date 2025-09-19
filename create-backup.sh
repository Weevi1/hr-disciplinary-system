#!/bin/bash
BACKUP_DIR="$HOME/hr-system-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"
cp -r /home/aiguy/projects/hr-disciplinary-system "$BACKUP_DIR/hr-system-$TIMESTAMP"
echo "Backup created: $BACKUP_DIR/hr-system-$TIMESTAMP"