# Disaster Recovery Plan

## Overview

This document outlines the disaster recovery procedures for the HR Disciplinary System. The plan covers various failure scenarios and provides step-by-step recovery procedures to minimize downtime and data loss.

## Recovery Objectives

- **RTO (Recovery Time Objective)**: 4 hours maximum
- **RPO (Recovery Point Objective)**: 24 hours maximum (daily backups)
- **Availability Target**: 99.9% uptime

## Backup Strategy

### Automated Backups

1. **Daily Backups** (2:00 AM UTC)
   - Full Firestore export
   - Critical storage files
   - Configuration files
   - Application data

2. **Retention Policy**
   - Daily backups: 7 days
   - Weekly backups: 4 weeks
   - Monthly backups: 12 months
   - Yearly backups: 5 years

### Backup Locations

- **Primary**: Google Cloud Storage buckets
- **Secondary**: GitHub Actions artifacts (30 days)
- **Configuration**: Version control (Git)

## Disaster Scenarios

### Scenario 1: Complete Firebase Project Loss

**Symptoms:**
- Firebase console inaccessible
- All services down
- Authentication failures

**Recovery Steps:**

1. **Immediate Response (0-1 hour)**
   ```bash
   # Create new Firebase project
   firebase projects:create hr-system-recovery
   
   # Enable required services
   gcloud services enable firestore.googleapis.com
   gcloud services enable storage.googleapis.com
   gcloud services enable cloudfunctions.googleapis.com
   ```

2. **Data Restoration (1-3 hours)**
   ```bash
   # Restore Firestore from backup
   gcloud firestore import gs://hr-disciplinary-system-backups/firestore/LATEST_BACKUP \
     --project=hr-system-recovery
   
   # Restore storage files
   gsutil -m rsync -r \
     gs://hr-disciplinary-system-backups/storage/LATEST_BACKUP \
     gs://hr-system-recovery.appspot.com
   ```

3. **Application Deployment (3-4 hours)**
   ```bash
   # Update environment configuration
   # Deploy application
   firebase deploy --project=hr-system-recovery
   ```

### Scenario 2: Firestore Database Corruption

**Symptoms:**
- Data inconsistencies
- Query failures
- Permission errors

**Recovery Steps:**

1. **Assessment (0-30 minutes)**
   ```bash
   # Check database status
   gcloud firestore operations list
   
   # Identify affected collections
   # Document corruption extent
   ```

2. **Selective Restore (30 minutes - 2 hours)**
   ```bash
   # Restore specific collections
   gcloud firestore import gs://backup-bucket/BACKUP_PATH \
     --collection-ids=users,employees,warnings
   ```

### Scenario 3: Storage Bucket Deletion

**Symptoms:**
- File access errors (404)
- Missing audio files and PDFs
- QR code download failures

**Recovery Steps:**

1. **Immediate Mitigation (0-15 minutes)**
   ```bash
   # Create new storage bucket
   gsutil mb gs://hr-disciplinary-system.appspot.com
   
   # Set up CORS and permissions
   gsutil cors set config/storage-cors.json gs://hr-disciplinary-system.appspot.com
   ```

2. **Data Restoration (15 minutes - 1 hour)**
   ```bash
   # Restore from backup
   gsutil -m rsync -r \
     gs://hr-disciplinary-system-backups/storage/LATEST \
     gs://hr-disciplinary-system.appspot.com
   ```

### Scenario 4: Application Code Loss

**Symptoms:**
- Deployment failures
- Repository unavailable
- Source code missing

**Recovery Steps:**

1. **Code Recovery (0-30 minutes)**
   ```bash
   # Clone from backup repository
   git clone https://github.com/Weevi1/hr-disciplinary-system.git
   
   # Or restore from local backups
   # Verify code integrity
   ```

2. **Environment Setup (30-60 minutes)**
   ```bash
   # Restore environment files
   # Install dependencies
   npm install
   
   # Verify configuration
   # Test build process
   npm run build
   ```

## Recovery Procedures

### Pre-Recovery Checklist

- [ ] Assess scope of disaster
- [ ] Notify stakeholders
- [ ] Activate disaster recovery team
- [ ] Document incident details
- [ ] Identify latest backup timestamps

### Recovery Process

1. **Initial Assessment (15 minutes)**
   - Determine failure scope
   - Check backup availability
   - Estimate recovery time
   - Communicate status

2. **Emergency Setup (1-2 hours)**
   - Set up temporary infrastructure
   - Restore critical data
   - Deploy minimal application
   - Test basic functionality

3. **Full Recovery (2-4 hours)**
   - Complete data restoration
   - Full application deployment
   - Comprehensive testing
   - Performance verification

4. **Post-Recovery (1-2 hours)**
   - Monitor system stability
   - Update DNS/routing
   - Communicate restoration
   - Document lessons learned

### Recovery Verification

```bash
# Health check script
#!/bin/bash
echo "Performing post-recovery verification..."

# Test application accessibility
curl -f https://hr-disciplinary-system.web.app/ || echo "❌ App not accessible"

# Test authentication
# Test database queries
# Test file uploads
# Test key workflows

echo "✅ Recovery verification completed"
```

## Emergency Contacts

### Technical Team
- **Lead Developer**: [Contact info]
- **DevOps Engineer**: [Contact info]  
- **System Administrator**: [Contact info]

### Business Team
- **Project Manager**: [Contact info]
- **Business Owner**: [Contact info]
- **HR Manager**: [Contact info]

### External Services
- **Firebase Support**: Firebase console support
- **Google Cloud Support**: GCP support ticket system
- **GitHub Support**: GitHub support portal

## Communication Plan

### Internal Communication
1. **Immediate** (< 15 minutes): Technical team notification
2. **Short-term** (< 1 hour): Management and stakeholders  
3. **Regular updates**: Every 30 minutes during recovery
4. **Resolution**: Final status and post-mortem scheduling

### External Communication
1. **Status page**: Update system status (if available)
2. **User notifications**: Email/in-app notifications
3. **Customer support**: Update support team with status

## Testing and Validation

### Monthly Tests
- Backup integrity verification
- Recovery procedure review
- Contact information updates
- Documentation updates

### Quarterly Tests
- Full disaster recovery simulation
- Recovery time measurement
- Process improvement identification
- Team training updates

## Post-Disaster Procedures

### Immediate (0-24 hours)
- System monitoring and stability checks
- User communication and support
- Incident documentation
- Initial impact assessment

### Short-term (1-7 days)
- Comprehensive post-mortem
- Process improvement implementation
- Backup verification and updates
- Team debriefing and training

### Long-term (1-4 weeks)
- Infrastructure hardening
- Backup strategy optimization
- Documentation updates
- Prevention measures implementation

## Backup Commands Reference

### Manual Backup Creation
```bash
# Full backup
node scripts/backup/backup-strategy.js backup production

# Configuration only
node scripts/backup/backup-strategy.js backup production --config-only

# Cleanup old backups
node scripts/backup/backup-strategy.js cleanup production
```

### Firestore Operations
```bash
# Export all data
gcloud firestore export gs://backup-bucket/TIMESTAMP

# Export specific collections
gcloud firestore export gs://backup-bucket/TIMESTAMP \
  --collection-ids=users,employees,warnings

# Import from backup
gcloud firestore import gs://backup-bucket/BACKUP_PATH
```

### Storage Operations
```bash
# Sync to backup
gsutil -m rsync -r gs://source-bucket gs://backup-bucket

# Restore from backup
gsutil -m rsync -r gs://backup-bucket gs://target-bucket

# Verify backup integrity
gsutil hash gs://backup-bucket/**
```

## Recovery Time Estimates

| Scenario | Detection | Recovery | Total |
|----------|-----------|----------|-------|
| Application failure | 5 min | 30 min | 35 min |
| Database corruption | 15 min | 2 hours | 2.25 hours |
| Storage loss | 10 min | 1 hour | 1.17 hours |
| Complete project loss | 30 min | 4 hours | 4.5 hours |

## Security Considerations

- Backup encryption in transit and at rest
- Access controls for recovery procedures
- Audit trail for all recovery activities
- Secure communication during incidents

## Continuous Improvement

- Regular review and updates (quarterly)
- Lessons learned integration
- Technology and process evolution
- Team training and certification