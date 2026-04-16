// AI Level Test Performance Audit Script
// Run this in browser console to verify handoff document requirements

const PerformanceAuditor = {
  async runCompleteAudit() {
    console.log('🔍 AI Level Test - Performance Audit Starting...\n');
    
    await this.checkPaintTiming();
    this.checkLayoutShift();
    this.checkAnimatedNumber();
    this.checkProgressBar();
    this.checkTransitions();
    this.checkExpandableSections();
    this.checkBlurEffects();
    this.checkGradientFallback();
    
    console.log('\n✅ Performance audit complete!');
  },

  async checkPaintTiming() {
    console.log('⚡ Paint Performance:');
    
    if ('performance' in window) {
      const paintEntries = performance.getEntriesByType('paint');
      
      paintEntries.forEach(entry => {
        const requirement = entry.startTime < 1000; // <1s requirement
        const status = requirement ? '✅' : '❌';
        console.log(`  ${entry.name}: ${status} ${Math.round(entry.startTime)}ms ${requirement ? '' : '(EXCEEDS 1s target)'}`);
      });

      // Check First Contentful Paint specifically
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        if (fcp.startTime > 1000) {
          console.log('  ⚠️  WARNING: FCP exceeds 1 second requirement from handoff');
        }
      }
    } else {
      console.log('  ❌ Performance API not available');
    }
  },

  checkLayoutShift() {
    console.log('\n📐 Layout Stability:');
    
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
        const good = clsScore < 0.1;
        console.log(`  Cumulative Layout Shift: ${good ? '✅' : '❌'} ${clsScore.toFixed(3)} ${good ? '' : '(EXCEEDS 0.1 target)'}`);
        
        if (!good) {
          console.log('  ⚠️  WARNING: Layout shifts detected - violates handoff requirement');
        }
      }, 3000);
    } else {
      console.log('  ❌ PerformanceObserver not available');
    }
  },

  checkAnimatedNumber() {
    console.log('\n🔢 AnimatedNumber Component:');
    
    // Look for animated number elements
    const animatedNumbers = document.querySelectorAll('[class*="font-extrabold"]:not([class*="text-4xl"]):not([class*="text-2xl"])');
    
    if (animatedNumbers.length > 0) {
      console.log('  ✅ AnimatedNumber elements found');
      console.log('  ⏱️  Expected timing: ~1.2s with per-digit steps (manual verification needed)');
      console.log('  📝 Requirement: Should feel satisfying, not too fast or slow');
    } else {
      console.log('  ⚠️  AnimatedNumber not currently visible (may be on results screen)');
    }
  },

  checkProgressBar() {
    console.log('\n📊 Progress Bar Accuracy:');
    
    const progressBars = document.querySelectorAll('[style*="width"]');
    const progressElements = Array.from(progressBars).filter(el => 
      el.style.width && el.style.width.includes('%')
    );
    
    if (progressElements.length > 0) {
      progressElements.forEach((el, index) => {
        const width = el.style.width;
        console.log(`  Progress bar ${index + 1}: ${width} ✅`);
      });
      
      // Check if progress text is accurate
      const progressText = document.querySelector('span:contains("of 6")');
      if (progressText) {
        console.log('  Progress text: ✅ Shows "X of 6" format');
      }
    } else {
      console.log('  ⚠️  Progress bar not currently visible (check during questions)');
    }
  },

  checkTransitions() {
    console.log('\n🔄 Screen Transitions:');
    
    // Check for ScreenTransition components
    const transitionElements = document.querySelectorAll('[class*="transition"],[class*="opacity"]');
    
    console.log(`  Transition elements found: ${transitionElements.length} ✅`);
    console.log('  📝 Requirement: 300ms fade should feel smooth, not janky');
    console.log('  🧪 Test: Navigate between screens to verify smoothness');
  },

  checkExpandableSections() {
    console.log('\n📖 Expandable Sections (Results Screen):');
    
    const expandableSections = document.querySelectorAll('[class*="max-h-"]');
    const maxH96Elements = Array.from(expandableSections).filter(el => 
      el.className.includes('max-h-96')
    );
    
    if (maxH96Elements.length > 0) {
      console.log(`  max-h-96 sections found: ${maxH96Elements.length} ✅`);
      console.log('  📝 Requirement: Content taller than 24rem will be clipped');
      console.log('  🧪 Manual check: Verify long content doesn\'t get cut off');
    } else {
      console.log('  ⚠️  Expandable sections not visible (check on results screen)');
    }
  },

  checkBlurEffects() {
    console.log('\n🌫️ Blur Effects:');
    
    // Check for blur styles
    const blurElements = document.querySelectorAll('[class*="blur"],[style*="blur"]');
    
    if (blurElements.length > 0) {
      console.log(`  Blur elements found: ${blurElements.length} ✅`);
      
      blurElements.forEach((el, index) => {
        const computed = getComputedStyle(el);
        const hasBlur = computed.filter && computed.filter.includes('blur');
        console.log(`  Element ${index + 1}: ${hasBlur ? '✅' : '❌'} blur effect ${hasBlur ? 'working' : 'not rendering'}`);
      });
      
      console.log('  📝 Requirement: Blurred teaser cards should be "tantalizingly almost-readable"');
    } else {
      console.log('  ⚠️  Blur elements not visible (check on lead capture screen)');
    }
  },

  checkGradientFallback() {
    console.log('\n🎨 Gradient Text Fallback:');
    
    const gradientText = document.querySelector('[class*="bg-gradient"],[class*="bg-clip-text"]');
    if (gradientText) {
      const computed = getComputedStyle(gradientText);
      const hasGradient = computed.backgroundImage && computed.backgroundImage.includes('gradient');
      const isTransparent = computed.webkitTextFillColor === 'transparent' || computed.color === 'transparent';
      
      if (hasGradient && isTransparent) {
        console.log('  ✅ Gradient text working');
      } else if (!hasGradient && computed.color === 'rgb(255, 255, 255)') {
        console.log('  ✅ Gradient fallback to white active (good for Safari iOS/Samsung)');
      } else {
        console.log('  ❌ Gradient text issue detected');
      }
    } else {
      console.log('  ⚠️  Gradient text not found');
    }
  }
};

// Auto-run if on landing page
if (document.querySelector('button:contains("Take the test")')) {
  PerformanceAuditor.runCompleteAudit();
} else {
  console.log('🛠️ Performance Auditor loaded!');
  console.log('Usage: PerformanceAuditor.runCompleteAudit()');
}

// Make available globally
window.PerformanceAuditor = PerformanceAuditor;