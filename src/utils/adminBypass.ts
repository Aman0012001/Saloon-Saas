// Auto-enable admin bypass mode for direct admin access
export const enableAdminBypass = () => {
  const currentUrl = window.location.href;
  
  if (currentUrl.includes('/admin')) {
    localStorage.setItem('admin-bypass', 'true');
    console.log('🚀 Admin bypass mode automatically enabled');
    return true;
  }
  
  return false;
};

// Initialize bypass mode on page load
if (typeof window !== 'undefined') {
  enableAdminBypass();
}