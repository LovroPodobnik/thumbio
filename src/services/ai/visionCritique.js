const cache = new Map();          // swap for IndexedDB later

export async function getVisionCritique(thumbnail) {
  console.log('[VisionCritique] Starting critique for thumbnail:', thumbnail.id);
  
  // Check cache first
  if (cache.has(thumbnail.id)) {
    console.log('[VisionCritique] Returning cached result for:', thumbnail.id);
    return cache.get(thumbnail.id);
  }

  // Check if API key exists
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  console.log('[VisionCritique] API Key exists:', !!apiKey);
  console.log('[VisionCritique] API Key length:', apiKey?.length || 0);
  console.log('[VisionCritique] API Key prefix:', apiKey?.substring(0, 10) + '...' || 'No key');
  
  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Please set REACT_APP_OPENAI_API_KEY in your .env file');
  }

  try {
    console.log('[VisionCritique] Making API request for thumbnail:', thumbnail.id);
    console.log('[VisionCritique] Thumbnail URL:', thumbnail.thumbnail);
    
    const body = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert YouTube thumbnail analyst and senior art director specializing in viewer engagement optimization.

CONTEXT: Analyze the provided image as a YouTube video thumbnail that needs to maximize click-through rate (CTR).

OUTPUT FORMAT: Return a valid JSON object with exactly this structure:
{
  "strengths": ["string", ...],
  "weaknesses": ["string", ...],
  "recommendations": ["string", ...],
  "overallVerdict": "string"
}

FIELD DEFINITIONS:
- strengths: Array of 3-5 specific visual elements that effectively grab attention or communicate value
- weaknesses: Array of 2-4 specific issues that may reduce click-through rate
- recommendations: Array of 3-5 actionable improvements ranked by potential impact
- overallVerdict: One sentence (max 20 words) summarizing thumbnail effectiveness on a scale of weak/moderate/strong

ANALYSIS CRITERIA:
1. Visual Hierarchy: Evaluate text size, contrast ratios, and focal points
2. Emotional Appeal: Assess facial expressions, color psychology, and curiosity gaps
3. Clarity: Check if the value proposition is immediately clear within 2 seconds
4. Mobile Optimization: Consider readability on small screens (50% of viewers)
5. Competitive Edge: Compare against typical thumbnails in the video's likely category

CONSTRAINTS:
- Each array item must be a complete, specific observation (max 25 words)
- Focus on actionable insights, not generic statements
- Prioritize CTR impact over artistic merit
- Reference specific visual elements (e.g., "yellow text at top-left" not "the text")
- Include specific metrics where relevant (e.g., "contrast ratio below 3:1")`.trim()
        },
        {
          role: "user",
          content: [{
            type: "image_url",
            image_url: { 
              url: thumbnail.thumbnail,
              detail: "low" // Best practice: reduces tokens from 8000+ to ~400
            }
          }]
        }
      ],
      temperature: 0.7, // Balanced between creativity and consistency
      max_tokens: 800, // Sufficient for structured response
      response_format: { type: "json_object" } // Ensures valid JSON output
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    console.log('[VisionCritique] API Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[VisionCritique] API Error response:', errorText);
      throw new Error(`OpenAI vision error ${res.status}: ${errorText}`);
    }

    const json = await res.json();
    console.log('[VisionCritique] API Response:', json);
    
    // Parse the JSON response
    const critique = JSON.parse(json.choices[0].message.content);
    console.log('[VisionCritique] Parsed critique:', critique);
    
    // Validate response structure
    if (!critique.strengths || !critique.weaknesses || !critique.recommendations || !critique.overallVerdict) {
      throw new Error('Invalid response structure from API');
    }
    
    // Cache the result
    cache.set(thumbnail.id, critique);
    
    return critique;
  } catch (error) {
    console.error('[VisionCritique] Error:', error);
    throw error;
  }
}

export function clearVisionCache() {
  cache.clear();
  console.log('[VisionCritique] Cache cleared');
}

export function getVisionCacheSize() {
  return cache.size;
} 