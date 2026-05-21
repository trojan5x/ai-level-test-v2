import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const LEVEL_METADATA = {
  0: { color: "#94a3b8", name: "Non-User",               tier: "Explorer",     percentile: 95 },
  1: { color: "#818cf8", name: "Experimenter",           tier: "Explorer",     percentile: 65 },
  2: { color: "#3b82f6", name: "Functional User",        tier: "Practitioner", percentile: 34 },
  3: { color: "#10b981", name: "Effective Practitioner", tier: "Operator",     percentile: 12 },
  4: { color: "#f59e0b", name: "AI-Native Performer",    tier: "Strategist",   percentile: 5  },
  5: { color: "#ef4444", name: "AI-Native Builder",      tier: "Architect",    percentile: 1  },
};

const PROFILE_TEXT = {
  0: "You haven't started yet — and that's fine. You're about to skip everyone else's mistakes. AI could catalyse your journey, as long as you are serious about staying ahead. Start with one real task this week.",
  1: "You've dipped your toes in. The gap between where you are and where AI could take you is bigger than you'd guess. You're using AI occasionally, but your mental model of what it can do is still forming. Push past your first response, this will help move you forward.",
  2: "You're getting real value from AI - but you're trusting the polish more than you should. You treat it like a search engine rather than a reasoning partner. How to get to the next frontier? Systematic multi-prompt iteration and output evaluation.",
  3: "You have judgment most people lack. You don't just use AI — you are ready to rewrite your career with it. You've crossed the threshold where you can evaluate output, not just consume it. Next: encode your judgment into repeatable workflow systems.",
  4: "AI isn't a tool you use - it's how you're already preparing for the future of work, tech, and innovation. Most people won't understand your workflow for another two years. You engineer architectures and structure automated agents. Your edge: organizational leverage and custom pipelines.",
  5: "You operate at the absolute technological vanguard. You design agentic systems, manage data stores, and advance the practice itself. Your focus: multi-agent consensus, cognitive routing, and frameworks that outlast your involvement.",
};

const STRENGTH_CARDS = {
  0: { label: "You Showed Up",        text: "Taking this assessment puts you ahead of 95% of people who talk about AI but never measure it. Awareness is the first real step — most people never get here." },
  1: { label: "Calibration Instinct", text: "You understand where AI shines and where it breaks. That boundary awareness is rarer than it sounds and is the exact foundation for everything that follows." },
  2: { label: "Consistent Usage",     text: "Your day-to-day AI habits show maturity. You've moved past experimenting into consistent, intentional use. That alone puts you in the top third of users." },
  3: { label: "You See Through Polish", text: "You caught the Artifact Effect — AI's most common trap. Most people default to the professional-looking response. You evaluate substance. That separates L3 from L2." },
  4: { label: "Strategic Iterator",   text: "When AI gives you a framework, you push back on substance — not just format. That's the skill gap between L3 and L4, and you've decisively crossed it." },
  5: { label: "Pioneer Mindset",      text: "You build systems that make others better. You're not just using AI — you're advancing the practice and creating leverage that multiplies across entire teams." },
};

const BLINDSPOT_CARDS = {
  0: { label: "The Cold Start",       text: "The hardest part isn't learning AI — it's starting. Don't wait for the perfect use case. Pick one real task this week. The relationship starts with a genuine need, not a tutorial." },
  1: { label: "The Artifact Effect",  text: "You may be picking polished responses over useful ones. AI's formatting tricks your brain into trust. Before using any output, ask: 'Is this actually saying something specific?'" },
  2: { label: "Format Over Substance", text: "When AI output looks good, you might accept it as-is. The question isn't 'how does this look?' — it's 'is the reasoning right?' Challenge the logic before you use it." },
  3: { label: "The Agreement Trap",   text: "When AI agrees with you too easily, that's exactly when you should push hardest. It's trained to be agreeable. Your job is to be the skeptic, especially when you want confirmation." },
  4: { label: "The Ceiling Trap",     text: "You're at the frontier of individual performance. The risk: optimizing your own workflow while missing the real multiplier — helping others level up. Teaching is your next leverage." },
  5: { label: "Complexity Debt",      text: "At this level, you may build systems only you understand. The risk is fragility. The next frontier is building for legibility and resilience — systems that outlast your direct involvement." },
};

const GROWTH_ROADMAPS = {
  0: [
    "Try AI for one real task this week — not a test. Something you actually need done. Start with writing: emails, summaries, brainstorms.",
    "Give AI more context. Instead of 'help me with X,' tell it who you are, what you need, and what good output looks like.",
    "Spend 15 min/week exploring one new AI tool. The goal isn't mastery — it's building a mental model of what's possible.",
  ],
  1: [
    "Don't settle for the first response. Re-prompt with specific feedback: 'make it more direct' or 'cut it by half and add an example.'",
    "Experiment where there's no single right answer — creative work, brainstorming, reframing problems. Low stakes, high learning.",
    "Verify crucial AI outputs against primary sources. Spotting hallucinations early builds the instinct that separates L2 from L1.",
  ],
  2: [
    "Before using any AI output, ask: 'Is this actually saying something specific?' That question alone closes the L2→L3 gap.",
    "Stop iterating on format. Start iterating on reasoning. Ask AI to justify its approach, then challenge it.",
    "Try AI as a research partner for one complex task — outlining a report, parsing a document, building a framework from scratch.",
  ],
  3: [
    "Build your best prompt interactions into repeatable templates. Your judgment should be encoded, not recreated manually each time.",
    "Design one workflow where AI handles specific steps and you handle the rest — don't just add AI to an existing process.",
    "Start a personal library of domain-specific prompts. Reusable, tested patterns are the compounding asset of L3→L4.",
  ],
  4: [
    "Build a specialized GPT or system-prompted agent for one routine team task. Share it. Measure the time saved.",
    "Explore one automation platform (Make.com, Zapier, n8n) to wire an AI step directly into a live workflow.",
    "Mentor one person on your AI approach. Explaining your system forces you to make it legible — which makes it better.",
  ],
  5: [
    "Fine-tune or build a domain-specific pipeline using open-weights models. The goal: something production-grade, not experimental.",
    "Formulate a team AI policy: what tasks AI owns, what it assists, and what stays human-only. Write it down. Ship it.",
    "Contribute to the practice — write, speak, or build something that advances how others think about AI systems design.",
  ],
};

function generateInsights(scores, level, relationshipStatus) {
  if (!scores) scores = {};
  const edge = scores.item3Correct
    ? "You saw through the Artifact Effect when most people don't. You judge output by substance, not polish."
    : scores.item2Correct >= 3
      ? "You know AI's boundary — where it shines and where it breaks. That's rarer than it sounds."
      : "You're early in understanding what AI can and can't do. That's normal — and the fastest skill to build.";

  const instinct = !scores.item3Correct
    ? "You chose polish over substance. The Artifact Effect — trusting AI output because it looks professional — is the #1 thing keeping people at Level 2."
    : (scores.item4Choice === "B" || scores.item4Choice === "A")
      ? "When AI's output was 80% there, you focused on format instead of substance. The question isn't 'how does this look?' — it's 'is the reasoning right?'"
      : (scores.restraintScore !== undefined && scores.restraintScore < 2)
        ? "You're tempted to use AI everywhere. But knowing when NOT to use it is just as important as knowing when to."
        : "No major gaps in the quick assessment. The detailed breakdown would reveal the subtler patterns.";

  const bridges = {
    0: "Start by trying AI for one writing task this week. Just one. See what happens.",
    1: "Try giving ChatGPT more context — who you are, what you need, and what good looks like. That's the bridge.",
    2: "When AI gives you something that looks good, ask: 'Is this actually saying something specific?' That question changes everything.",
    3: "You have the judgment. Now build it into a system — workflows where AI handles the right steps and you handle the rest.",
    4: "You're at the frontier. The next step is building systems that uplift others — and pushing the boundary of what's possible.",
    5: "You build systems that make others better. The next step is advancing the practice itself.",
    6: "You're at the frontier. The practice evolves because people like you refuse to accept the current ceiling.",
  };

  const relationshipTips = {
    single: "Your first step isn't learning prompts — it's finding one real problem AI can solve for you. The relationship starts with a real need.",
    casual: "You're treating AI like a search engine with extra steps. Try giving it a real problem and having a 5-turn conversation. See what happens when you push back on its first answer.",
    committed: "You've built a real working relationship. The next step is knowing when AI's judgment should override yours in specific domains — and when yours should override it.",
    merged: "Watch for cognitive dependency. Can you still do deep thinking without AI as a sounding board? The strongest position is 'merged by choice, independent by capability.'",
    complicated: "You have the skills of a high-level user, but the habits of a casual one. Pick a lane — either master a specific workflow or accept that AI is just a tool for you."
  };

  return {
    edge,
    instinct,
    bridge: bridges[Math.min(level, 6)],
    relationshipTip: relationshipTips[relationshipStatus || "casual"] || relationshipTips.casual
  };
}

const loadImgDataUrl = (src) =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width  = img.naturalWidth  || img.width  || 200;
        c.height = img.naturalHeight || img.height || 60;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve({ dataUrl: c.toDataURL('image/png'), w: c.width, h: c.height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

export const generateAIReportPDF = async (leadData) => {
  const { name, phone, email, level, relationshipStatus, scores, referralId } = leadData;
  const lvl  = Math.max(0, Math.min(5, parseInt(level) || 0));
  const relationshipStatusStr = relationshipStatus || 'casual';
  const meta  = LEVEL_METADATA[lvl];
  const ac    = meta.color;
  const insights = generateInsights(scores, lvl, relationshipStatusStr);
  
  const [ltLogo, googleLogo, imaginxtLogo] = await Promise.all([
    loadImgDataUrl('/learntube-report-logo.png'),
    loadImgDataUrl('/backed-by-google.png'),
    loadImgDataUrl('/imaginxt-2026-logo.png'),
  ]);

  const ltImg = ltLogo ? ltLogo.dataUrl : "";
  const googleImg = googleLogo ? googleLogo.dataUrl : "";
  const ixImg = imaginxtLogo ? imaginxtLogo.dataUrl : "";

  // Helper for generating dimensions bars
  const renderDims = () => {
    // CORRECTED KEYS mapping to scores
    const dims = [
      { key: 'dietScore',          label: 'AI Diet & Variety' },
      { key: 'featureDepthScore',  label: 'Context Depth' },
      { key: 'behavFreqScore',     label: 'Behavioral Frequency' },
      { key: 'workflowScore',      label: 'Workflow Integration' },
      { key: 'systemBuilderScore', label: 'System Architecture' },
    ];
    return dims.map((d, i) => {
      const val = Math.min(scores?.[d.key] ?? 0, 6);
      const pct = (val / 6) * 100;
      const isLast = i === dims.length - 1;
      return `
        <div style="margin-bottom: ${isLast ? '0' : '16px'};">
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; color: #d1d5db; margin-bottom: 8px;">
            <span>${d.label}</span>
            <span style="color: ${ac}">${val}/6</span>
          </div>
          <div style="width: 100%; height: 8px; background-color: #374151; border-radius: 4px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background-color: ${ac}; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderSteps = () => {
    const steps = GROWTH_ROADMAPS[lvl] || GROWTH_ROADMAPS[4];
    return steps.map((step, i) => {
      const isLast = i === steps.length - 1;
      return `
      <div style="display: flex; gap: 20px; margin-bottom: ${isLast ? '0' : '24px'};">
        <div style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; background-color: ${ac}25; color: ${ac}; text-align: center; line-height: 38px; font-weight: bold; font-size: 18px; border: 1px solid ${ac}40; box-sizing: border-box;">
          <span style="position: relative; top: -10px; display: inline-block;">${i + 1}</span>
        </div>
        <div>
          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #f3f4f6;">Step ${i + 1}</h4>
          <p style="margin: 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">${step}</p>
        </div>
      </div>
    `}).join('');
  };

  // Create an offscreen div
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.zIndex = '-1';
  
  const pageStyle = `width: 800px; height: 1130px; background-color: #09090b; padding: 48px; box-sizing: border-box; display: flex; flex-direction: column; font-family: ui-sans-serif, system-ui, sans-serif; position: relative; color: #ffffff;`;
  
  const headerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid #1f2937; margin-bottom: 32px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${ltImg ? `<img src="${ltImg}" style="height: 48px;" />` : '<div style="font-weight: 900; font-size: 36px; color: #ffffff;">LEARNTUBE.AI</div>'}
      </div>
      <div style="display: flex; align-items: center; gap: 20px;">
        ${googleImg ? `<img src="${googleImg}" style="height: 36px;" />` : ''}
        <div style="width: 1px; height: 40px; background-color: #374151;"></div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 10px; font-weight: 600; color: #9ca3af; letter-spacing: 0.05em;">IN PARTNERSHIP WITH</span>
          ${ixImg ? `<img src="${ixImg}" style="height: 51.84px;" />` : '<div style="font-weight: 800; font-size: 37.44px; color: #ffffff;">IMAGINEXT</div>'}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div id="pdf-page-1" style="${pageStyle}">
      <div style="position: absolute; top: 12px; left: 12px; right: 12px; bottom: 12px; border: 1px solid #1f2937; pointer-events: none; border-radius: 8px;"></div>
      ${headerHTML}
      
      <!-- Hero Section (Side-by-side layout) -->
      <div style="background-color: #111827; border: 1px solid #1f2937; border-top: 4px solid ${ac}; border-radius: 24px; padding: 40px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
        <!-- Left Side: Level & Info -->
        <div style="display: flex; align-items: center; gap: 32px;">
          <div style="font-size: 100px; font-weight: 900; color: ${ac}; line-height: 1; padding-bottom: 8px; margin-top: -56px;">${lvl >= 5 ? '5+' : lvl}</div>
          <div style="text-align: left;">
            <div style="font-size: 14px; font-weight: 800; color: #9ca3af; letter-spacing: 0.15em; margin-bottom: 8px; text-transform: uppercase;">Your AI Level</div>
            <div style="font-size: 26px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 16px;">${meta.name}</div>
            <div style="display: inline-block; background-color: #1f2937; border: 1px solid #374151; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: #e5e7eb; letter-spacing: 0.05em;">
              <span style="position: relative; top: -7px; display: inline-block;">TOP ${meta.percentile}% OF USERS</span>
            </div>
          </div>
        </div>
        
        <!-- Right Side: Badges -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background-color: ${ac}20; color: ${ac}; border: 1px solid ${ac}40; padding: 10px 20px; border-radius: 9999px; font-size: 12.6px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; min-width: 126px;">
            <span style="position: relative; top: -8px; display: inline-block;">${meta.tier}</span>
          </div>
          <div style="background-color: #1f2937; color: #d1d5db; border: 1px solid #374151; padding: 10px 20px; border-radius: 9999px; font-size: 12.6px; font-weight: 700; text-align: center; min-width: 126px;">
            <span style="position: relative; top: -5px; display: inline-block;">${(relationshipStatusStr || 'casual').charAt(0).toUpperCase() + (relationshipStatusStr || 'casual').slice(1)}</span>
          </div>
        </div>
      </div>

      <!-- Candidate Profile -->
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 16px;">
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
          <div style="font-size: 13px; font-weight: 800; color: #6b7280; letter-spacing: 0.15em; text-transform: uppercase;">Candidate Profile</div>
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
        </div>
        
        <div style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <div style="font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 6px; letter-spacing: 0.05em;">NAME</div>
            <div style="font-size: 18px; font-weight: 700; color: #f3f4f6;">${name || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 6px; letter-spacing: 0.05em;">EMAIL</div>
            <div style="font-size: 18px; font-weight: 700; color: #f3f4f6;">${email || 'Not provided'}</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 6px; letter-spacing: 0.05em;">PHONE</div>
            <div style="font-size: 18px; font-weight: 700; color: #f3f4f6;">${phone || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 6px; letter-spacing: 0.05em;">REF CODE</div>
            <div style="font-size: 18px; font-weight: 700; color: #f3f4f6;">${referralId || 'SYSTEM'}</div>
          </div>
        </div>
      </div>

      <!-- Skill Dimensions -->
      <div>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 16px;">
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
          <div style="font-size: 13px; font-weight: 800; color: #6b7280; letter-spacing: 0.15em; text-transform: uppercase;">Skill Dimensions</div>
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
        </div>
        
        <div style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px;">
          ${renderDims()}
        </div>
      </div>
      
      <div style="margin-top: auto; padding-top: 24px; display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; font-weight: 600; letter-spacing: 0.05em; border-top: 1px solid #1f2937;">
        <span>AI COGNITIVE BLUEPRINT · CONFIDENTIAL</span>
        <span>PAGE 1 / 3</span>
      </div>
    </div>

    <!-- PAGE 2 -->
    <div id="pdf-page-2" style="${pageStyle}">
      <div style="position: absolute; top: 12px; left: 12px; right: 12px; bottom: 12px; border: 1px solid #1f2937; pointer-events: none; border-radius: 8px;"></div>
      ${headerHTML}
      
      <!-- Your Profile -->
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
          <div style="font-size: 13px; font-weight: 800; color: #6b7280; letter-spacing: 0.15em; text-transform: uppercase;">Your Profile</div>
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
        </div>
        
        <div style="background: #111827; border: 1px solid #1f2937; border-left: 6px solid ${ac}; border-radius: 16px; padding: 24px;">
          <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #d1d5db;">${PROFILE_TEXT[lvl]}</p>
        </div>
      </div>

      <!-- Strengths & Blindspots -->
      <div style="display: flex; gap: 24px; margin-bottom: 32px;">
        <div style="flex: 1; background: #064e3b20; border: 1px solid #064e3b80; border-top: 6px solid #10b981; border-radius: 16px; padding: 24px;">
          <div style="font-size: 12px; font-weight: 800; color: #34d399; margin-bottom: 12px; letter-spacing: 0.1em; text-transform: uppercase;">What's Working</div>
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #f3f4f6;">${STRENGTH_CARDS[lvl].label}</h3>
          <p style="margin: 0; font-size: 14px; color: #a7f3d0; line-height: 1.6;">${STRENGTH_CARDS[lvl].text}</p>
        </div>
        <div style="flex: 1; background: #7c2d1220; border: 1px solid #7c2d1280; border-top: 6px solid #f59e0b; border-radius: 16px; padding: 24px;">
          <div style="font-size: 12px; font-weight: 800; color: #fbbf24; margin-bottom: 12px; letter-spacing: 0.1em; text-transform: uppercase;">Watch Out For</div>
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #f3f4f6;">${BLINDSPOT_CARDS[lvl].label}</h3>
          <p style="margin: 0; font-size: 14px; color: #fde68a; line-height: 1.6;">${BLINDSPOT_CARDS[lvl].text}</p>
        </div>
      </div>

      <!-- Be Future-Ready -->
      <div>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
          <div style="font-size: 13px; font-weight: 800; color: #6b7280; letter-spacing: 0.15em; text-transform: uppercase;">Be Future-Ready</div>
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
        </div>
        
        <div style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px;">
          ${renderSteps()}
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 24px; display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; font-weight: 600; letter-spacing: 0.05em; border-top: 1px solid #1f2937;">
        <span>AI COGNITIVE BLUEPRINT · CONFIDENTIAL</span>
        <span>PAGE 2 / 3</span>
      </div>
    </div>

    <!-- PAGE 3 -->
    <div id="pdf-page-3" style="${pageStyle}">
      <div style="position: absolute; top: 12px; left: 12px; right: 12px; bottom: 12px; border: 1px solid #1f2937; pointer-events: none; border-radius: 8px;"></div>
      ${headerHTML}
      
      <!-- Full Breakdown -->
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
          <div style="font-size: 13px; font-weight: 800; color: #6b7280; letter-spacing: 0.15em; text-transform: uppercase;">Your Full Breakdown</div>
          <div style="height: 1px; flex: 1; background-color: #1f2937;"></div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: #ffffff;">✨ Your Edge</h3>
            <p style="margin: 0; font-size: 15px; color: #d1d5db; line-height: 1.6;">${insights.edge}</p>
          </div>
          
          <div style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: #ffffff;">🎯 Your Evaluation Instinct</h3>
            <p style="margin: 0; font-size: 15px; color: #d1d5db; line-height: 1.6;">${insights.instinct}</p>
          </div>
          
          <div style="background: #111827; border: 1px solid #1f2937; border-top: 6px solid #10b981; border-radius: 16px; padding: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: #ffffff;">🚀 Start Shaping Your Future, Today.</h3>
            <p style="margin: 0; font-size: 15px; color: #d1d5db; line-height: 1.6;">${insights.bridge}</p>

            <div style="border-top: 1px solid #1f2937; padding-top: 16px; margin-top: 16px;">
              <div style="display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 14px; margin-top: 2px;">🧬</span>
                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6; font-style: italic;">
                  ${insights.relationshipTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 24px; display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; font-weight: 600; letter-spacing: 0.05em; border-top: 1px solid #1f2937;">
        <span>AI COGNITIVE BLUEPRINT · CONFIDENTIAL</span>
        <span>PAGE 3 / 3</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(container);

  // Allow styles to apply and images to load
  await new Promise(r => setTimeout(r, 150));

  try {
    const page1Element = document.getElementById('pdf-page-1');
    const page2Element = document.getElementById('pdf-page-2');
    const page3Element = document.getElementById('pdf-page-3');

    const canvas1 = await html2canvas(page1Element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#09090b' });
    const canvas2 = await html2canvas(page2Element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#09090b' });
    const canvas3 = await html2canvas(page3Element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#09090b' });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = 210;
    const pdfH = 297;

    doc.addImage(canvas1.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH);
    doc.addPage();
    doc.addImage(canvas2.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH);
    doc.addPage();
    doc.addImage(canvas3.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH);

    return doc.output('blob');
  } finally {
    document.body.removeChild(container);
  }
};

const REPORT_SEND_API =
  'https://xgfy-czuw-092q.m2.xano.io/api:GzVKKOQ4/aireadiness/report/send';

export const dispatchPDFReportToWhatsApp = (phone, pdfBlob, leadData = {}, badgeBlob = null) => {
  const endpoint = window.WHATSAPP_PDF_API_URL || REPORT_SEND_API;
  const lvl = Math.max(0, Math.min(5, parseInt(leadData.level, 10) || 0));
  const levelTitle = LEVEL_METADATA[lvl]?.name || 'Unknown';
  const relationshipStatus = leadData.relationshipStatus || 'casual';

  const safeName = (leadData.name || 'candidate').replace(/[^\w\s-]/g, '').trim() || 'candidate';
  const pdfFile = new File(
    [pdfBlob],
    `${safeName}.pdf`,
    { type: 'application/pdf' }
  );

  const formData = new FormData();
  formData.append('phone', phone);
  formData.append('name', leadData.name || '');
  formData.append('level', String(lvl));
  formData.append('level_title', levelTitle);
  formData.append('relationship_status', relationshipStatus);
  formData.append('pdf_file', pdfFile);

  if (badgeBlob) {
    const badgeFile = new File(
      [badgeBlob],
      `${safeName}-badge.png`,
      { type: 'image/png' }
    );
    formData.append('badge_file', badgeFile);
  }

  fetch(endpoint, { method: 'POST', body: formData })
    .then(async (r) => {
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`${r.status} ${r.statusText} - ${errText}`);
      }
      return r.json();
    })
    .then((d) => console.log('✅ Report send OK', d))
    .catch((e) => console.warn('⚠️ Report send skipped:', e));
};
