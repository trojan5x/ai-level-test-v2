# Supabase Edge Function for LLM Scoring

## Create Edge Function: `llm-score-response`

```bash
# Run in your Supabase project
supabase functions new llm-score-response
```

## Edge Function Implementation

File: `supabase/functions/llm-score-response/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { item, text, context } = await req.json()
    
    if (!item || !text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: item, text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Gemini API key from environment
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'LLM service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Scoring prompts based on item type
    const scoringPrompts = {
      '5b': {
        system: `You are evaluating a rewritten sales prompt. Score 1-3 based on quality:

Score 3 (Strategic): 
- Includes specific context (role, experience, industry)
- States a concrete problem (not generic "get better at sales")
- Tells AI what output format to produce
- Sets up diagnostic conversation vs asking for tips list

Score 2 (Contextual): 
- Adds some context (role OR experience OR situation)
- Still asking for generic advice but with some specifics

Score 1 (Basic):
- Just rephrased the original without adding meaningful context
- Still a generic query like "help me with sales"

Original bad prompt: "what are some ways to get better at sales"
User's rewrite: "${text}"

Respond with just a number (1, 2, or 3) and brief reasoning.`,
        
        maxTokens: 100
      },
      
      '6': {
        system: `You are evaluating a follow-up question to AI analysis. Score 1-4 based on depth:

Score 4 (Reframe): 
- Rejects AI's frame entirely, proposes alternative hypothesis
- Introduces contradictory evidence or "what if opposite is true"
- Examples: "What if this data actually shows...", "Could we be wrong about..."

Score 3 (Challenge):
- Challenges an assumption in AI's analysis
- Identifies gaps or questions the reasoning
- Examples: "What assumption are we making about...", "How do we know..."

Score 2 (Depth):
- Asks probing questions about specific points
- Seeks more detail but accepts AI's frame
- Examples: "How much impact...", "What specific factors..."

Score 1 (Format):
- Asks for formatting changes or surface-level detail
- Examples: "Make it shorter", "Add bullet points", "Explain more"

AI's analysis: "Your sprint underperformance likely stems from three factors: scope creep, resource constraints (two members on leave), and estimation gaps. To improve: lock requirements before sprint start, build buffer for absences, and run estimation retros."

User's follow-up: "${text}"

Respond with just a number (1, 2, 3, or 4) and brief reasoning.`,
        
        maxTokens: 150
      }
    }

    const prompt = scoringPrompts[item]
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: `Invalid item type: ${item}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt.system
            }]
          }],
          generationConfig: {
            maxOutputTokens: prompt.maxTokens,
            temperature: 0.1,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Extract score from response
    const scoreMatch = responseText.match(/\b([1-4])\b/)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 1
    
    // Validate score range based on item
    const maxScore = item === '6' ? 4 : 3
    const finalScore = Math.min(Math.max(score, 1), maxScore)

    return new Response(
      JSON.stringify({
        score: finalScore,
        reasoning: responseText.trim(),
        model: 'gemini-1.5-flash'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('LLM scoring error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'LLM scoring failed',
        fallback: true // Indicates client should use keyword scoring
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

## Frontend Integration

Update `src/supabase.js` to add LLM scoring function:

```javascript
// Add to supabase.js
export const scoreLLMResponse = async (item, text) => {
  try {
    const { data, error } = await supabase.functions.invoke('llm-score-response', {
      body: { item, text }
    });

    if (error) {
      console.error('LLM scoring error:', error);
      return { useFallback: true };
    }

    return { 
      score: data.score, 
      reasoning: data.reasoning,
      model: data.model 
    };

  } catch (err) {
    console.error('LLM scoring exception:', err);
    return { useFallback: true };
  }
};
```

## Environment Variables

Set in Supabase Dashboard → Project Settings → Edge Functions:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Deployment Commands

```bash
# Deploy the edge function
supabase functions deploy llm-score-response

# Test the function
curl -X POST 'https://your-project.supabase.co/functions/v1/llm-score-response' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"item":"5b","text":"I'\''m a B2B SaaS account exec with 2 years experience. My close rate dropped from 22% to 14% this quarter. Help me diagnose what specific stage in my sales process is breaking down and give me a framework to identify the root cause."}'
```