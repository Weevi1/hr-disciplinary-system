// Quick fix for Firebase custom claims permissions issue
// Run this in the browser console when logged in as manager@robertsonspar.com

console.log('🔧 Refreshing user custom claims...');

// Get the functions reference
import('./frontend/src/services/FirebaseService.js').then(({ FirebaseService }) => {
  return FirebaseService.refreshUserClaims();
}).then(result => {
  console.log('✅ Custom claims refreshed successfully:', result);
  console.log('🔄 Please refresh the page to apply the new permissions');
}).catch(error => {
  console.error('❌ Failed to refresh custom claims:', error);
  console.log('💡 Try logging out and logging back in to trigger the automatic claims setup');
});