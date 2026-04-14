// Enhanced Mobile UI Optimization Script
// Run this in browser console at lead capture screen

const MobileOptimizer = {
  // Test critical mobile viewports
  testViewports: [
    { name: 'iPhone SE', width: 375, height: 667, critical: true },
    { name: 'iPhone 12/13 Mini', width: 375, height: 812 },
    { name: 'iPhone 12/13/14', width: 390, height: 844 },
    { name: 'iPhone 12/13/14 Plus', width: 414, height: 896 },
    { name: 'Galaxy S20', width: 360, height: 800 },
    { name: 'Galaxy S22 Ultra', width: 384, height: 854 }
  ],

  currentViewport: null,

  simulateViewport(viewport) {
    const { name, width, height } = viewport;
    this.currentViewport = viewport;

    // Apply viewport constraints
    document.documentElement.style.width = `${width}px`;
    document.documentElement.style.height = `${height}px`;
    document.body.style.width = `${width}px`;
    document.body.style.height = `${height}px`;

    console.log(`📱 Simulating ${name} (${width}×${height})`);
    
    // Run checks
    setTimeout(() => {
      this.checkLeadCaptureScreen();
      this.checkKeyboardHandling();
      this.checkTapTargets();
    }, 500);
  },

  checkLeadCaptureScreen() {
    const { name, width, height } = this.currentViewport;
    console.log(`\n🔍 Checking Lead Capture on ${name}:`);

    // Check if level number is visible
    const levelNumber = document.querySelector('[style*="color:"]');
    if (levelNumber) {
      const rect = levelNumber.getBoundingClientRect();
      const visible = rect.top >= 0 && rect.top < height * 0.3; // Top 30% of screen
      console.log(`  Level Number: ${visible ? '✅' : '❌'} (${Math.round(rect.top)}px from top)`);
    }

    // Check if all 3 locked cards are visible
    const lockedCards = document.querySelectorAll('[class*="border-gray-800"]');
    if (lockedCards.length >= 3) {
      const lastCard = lockedCards[2];
      const rect = lastCard.getBoundingClientRect();
      const visible = rect.bottom < height * 0.65; // Upper 65% of screen
      console.log(`  3rd Locked Card: ${visible ? '✅' : '❌'} (${Math.round(rect.bottom)}px from top)`);
    }

    // Check form visibility
    const nameInput = document.querySelector('input[placeholder*="name" i]');
    const phoneInput = document.querySelector('input[placeholder*="phone" i], input[placeholder*="whatsapp" i]');
    const submitBtn = document.querySelector('button[class*="bg-white"]');

    if (nameInput && phoneInput && submitBtn) {
      const formTop = nameInput.getBoundingClientRect().top;
      const submitBottom = submitBtn.getBoundingClientRect().bottom;
      const formVisible = formTop < height * 0.8 && submitBottom < height * 0.95;
      console.log(`  Form Elements: ${formVisible ? '✅' : '❌'} (form: ${Math.round(formTop)}-${Math.round(submitBottom)}px)`);
      
      // Critical check: entire form fits in viewport without scrolling
      const totalHeight = submitBottom - Math.min(levelNumber?.getBoundingClientRect().top || 0, formTop);
      const fitsInViewport = totalHeight < height * 0.9; // 90% of viewport height
      console.log(`  Single-fold fit: ${fitsInViewport ? '✅' : '❌'} (total: ${Math.round(totalHeight)}px vs ${height}px viewport)`);
      
      if (!fitsInViewport) {
        console.log(`  ⚠️  CRITICAL: Lead capture doesn't fit in single fold on ${name}`);
        console.log(`     Recommendation: Reduce spacing, smaller level number, or compress cards`);
      }
    }
  },

  checkTapTargets() {
    console.log(`\n👆 Checking Tap Targets:`);
    
    const submitBtn = document.querySelector('button[class*="bg-white"]');
    if (submitBtn) {
      const rect = submitBtn.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const adequate = size >= 44; // Apple HIG minimum
      console.log(`  Submit Button: ${adequate ? '✅' : '❌'} (${Math.round(size)}px, need ≥44px)`);
    }

    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, i) => {
      const rect = input.getBoundingClientRect();
      const height = rect.height;
      const adequate = height >= 40; // Comfortable for mobile
      console.log(`  Input ${i + 1}: ${adequate ? '✅' : '❌'} (${Math.round(height)}px height)`);
    });
  },

  checkKeyboardHandling() {
    console.log(`\n⌨️  Keyboard Interaction:`);
    
    const nameInput = document.querySelector('input[placeholder*="name" i]');
    if (nameInput) {
      // Simulate focusing (keyboard appears)
      const beforeFocus = nameInput.getBoundingClientRect();
      console.log(`  Name Input Position: ${Math.round(beforeFocus.top)}px from top`);
      
      // Check if autofocus is properly set
      const hasAutofocus = nameInput.hasAttribute('autofocus');
      console.log(`  Autofocus Set: ${hasAutofocus ? '✅' : '❌'}`);
      
      // Check if input is in comfortable position when keyboard appears (simulate 50% viewport)
      const keyboardHeight = this.currentViewport.height * 0.5;
      const availableSpace = this.currentViewport.height - keyboardHeight;
      const inputVisibleWithKeyboard = beforeFocus.top < availableSpace * 0.3;
      console.log(`  Visible w/ Keyboard: ${inputVisibleWithKeyboard ? '✅' : '❌'} (${availableSpace}px available)`);
    }
  },

  checkPerformance() {
    console.log(`\n⚡ Performance Check:`);
    
    // Check for layout shifts
    if ('PerformanceObserver' in window) {
      let clsScore = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      
      setTimeout(() => {
        observer.disconnect();
        console.log(`  Cumulative Layout Shift: ${clsScore < 0.1 ? '✅' : '❌'} (${clsScore.toFixed(3)})`);
      }, 2000);
    }

    // Check paint timing
    if ('performance' in window) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        const fast = entry.startTime < 1000; // < 1s target
        console.log(`  ${entry.name}: ${fast ? '✅' : '❌'} (${Math.round(entry.startTime)}ms)`);
      });
    }
  },

  runFullAudit() {
    console.log('🚀 Starting Mobile UI Audit...\n');
    
    this.testViewports.forEach((viewport, index) => {
      setTimeout(() => {
        this.simulateViewport(viewport);
        
        if (index === this.testViewports.length - 1) {
          setTimeout(() => {
            this.checkPerformance();
            this.reset();
            console.log('\n✅ Mobile audit complete!');
          }, 1000);
        }
      }, index * 3000);
    });
  },

  reset() {
    document.documentElement.style.width = '';
    document.documentElement.style.height = '';
    document.body.style.width = '';
    document.body.style.height = '';
    console.log('📱 Viewport reset to normal');
  },

  // Quick fix suggestions
  suggestFixes() {
    console.log('\n🔧 Mobile Optimization Suggestions:');
    console.log('1. Level number: Consider reducing from text-5xl to text-4xl on mobile');
    console.log('2. Locked cards: Reduce vertical spacing (space-y-1.5 → space-y-1)');
    console.log('3. Form: Ensure py-8 padding doesn\'t push content below fold');
    console.log('4. Submit button: Current py-3 (≈48px) meets tap target requirements');
    console.log('5. Phone input: +91 prefix styling is good for India launch');
  }
};

// Make available globally
window.MobileOptimizer = MobileOptimizer;

console.log('🛠️ Mobile Optimizer loaded!');
console.log('Usage:');
console.log('  MobileOptimizer.runFullAudit() - Test all devices');
console.log('  MobileOptimizer.simulateViewport(MobileOptimizer.testViewports[0]) - Test iPhone SE');
console.log('  MobileOptimizer.suggestFixes() - Get optimization tips');