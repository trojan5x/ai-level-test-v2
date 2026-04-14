// Mobile Testing Utilities
// Add this to browser console to test mobile viewport scenarios

const MobileTestUtils = {
  // Test iPhone SE viewport (375x667 - smallest common mobile viewport)
  testMobileViewport() {
    const viewport = { width: 375, height: 667 };
    console.log(`🔍 Testing iPhone SE viewport (${viewport.width}x${viewport.height})`);
    
    // Simulate viewport
    document.documentElement.style.width = `${viewport.width}px`;
    document.documentElement.style.height = `${viewport.height}px`;
    
    // Check critical elements
    this.checkLeadCaptureScreen();
    this.checkLandingCTA();
    
    setTimeout(() => {
      // Reset
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      console.log('✅ Viewport reset');
    }, 5000);
  },
  
  checkLeadCaptureScreen() {
    // Look for lead capture elements
    const levelNumber = document.querySelector('[class*="text-6xl"], [class*="text-8xl"]');
    const form = document.querySelector('form, [class*="form"]');
    const nameInput = document.querySelector('input[placeholder*="name" i]');
    const phoneInput = document.querySelector('input[placeholder*="phone" i]');
    const submitBtn = document.querySelector('button[class*="bg-white"]');
    
    if (levelNumber) {
      const rect = levelNumber.getBoundingClientRect();
      console.log(`📱 Level number visible: ${rect.top < 667 ? '✅' : '❌'} (${rect.top}px from top)`);
    }
    
    if (form) {
      const rect = form.getBoundingClientRect();
      console.log(`📱 Form fits in viewport: ${rect.bottom < 667 ? '✅' : '❌'} (${rect.bottom}px height)`);
    }
    
    if (submitBtn) {
      const rect = submitBtn.getBoundingClientRect();
      const tapTargetSize = Math.min(rect.width, rect.height);
      console.log(`📱 Submit button tap target: ${tapTargetSize >= 44 ? '✅' : '❌'} (${tapTargetSize}px)`);
    }
  },
  
  checkLandingCTA() {
    const cta = document.querySelector('button:contains("Take the test"), button[class*="bg-white"]');
    if (cta) {
      const rect = cta.getBoundingClientRect();
      console.log(`📱 Landing CTA visible without scroll: ${rect.bottom < 667 ? '✅' : '❌'} (${rect.bottom}px)`);
    }
  },
  
  // Test gradient text fallback (for Safari compatibility)
  testGradientText() {
    const gradientText = document.querySelector('[class*="bg-clip-text"]');
    if (gradientText) {
      const computed = getComputedStyle(gradientText);
      const hasGradient = computed.backgroundImage.includes('gradient');
      console.log(`🎨 Gradient text support: ${hasGradient ? '✅' : '⚠️ Fallback needed'}`);
      
      if (!hasGradient) {
        // Apply fallback
        gradientText.style.background = 'none';
        gradientText.style.color = 'white';
        console.log('🔧 Applied white text fallback');
      }
    }
  },
  
  // Test blur effect support
  testBlurSupport() {
    const blurredElement = document.querySelector('[class*="blur-"]');
    if (blurredElement) {
      const computed = getComputedStyle(blurredElement);
      const hasBlur = computed.filter.includes('blur');
      console.log(`🌫️ Blur effect support: ${hasBlur ? '✅' : '⚠️ No blur detected'}`);
    }
  }
};

// Make it available globally for testing
window.MobileTestUtils = MobileTestUtils;

console.log('🛠️ Mobile Test Utils loaded. Use MobileTestUtils.testMobileViewport() to start testing');