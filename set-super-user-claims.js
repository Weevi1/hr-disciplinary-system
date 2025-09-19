// Set super-user custom claims directly
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'hr-disciplinary-system'
  });
}

async function setSuperUserClaims() {
  try {
    const uid = 'SYCfyGeQJ9OXTGNo7LPiNLRa7EX2'; // The user ID from the logs
    
    console.log('Setting super-user custom claims for:', uid);
    
    await admin.auth().setCustomUserClaims(uid, {
      role: 'super-user',
      permissions: ['all'],
      organizationId: 'SYSTEM',
      isFounder: true,
      grantedAt: new Date().toISOString()
    });
    
    console.log('✅ Super-user custom claims set successfully!');
    
    // Verify the claims
    const user = await admin.auth().getUser(uid);
    console.log('Current custom claims:', user.customClaims);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to set super-user claims:', error);
    process.exit(1);
  }
}

setSuperUserClaims();