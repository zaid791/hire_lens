import { GoogleGenAI, Type } from "@google/genai";
import { GitHubProfile, GitHubRepo, LanguageStat, CommitPattern, GeminiAnalysis } from '../types/index';

export async function analyzeWithGemini(
  profile: GitHubProfile,
  repos: GitHubRepo[],
  languageStats: LanguageStat[],
  commitPattern: CommitPattern
): Promise<GeminiAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze the following GitHub developer profile and return a JSON object.
    
    Profile: ${JSON.stringify(profile)}
    Repositories: ${JSON.stringify(repos)}
    Language Statistics: ${JSON.stringify(languageStats)}
    Commit Pattern: ${JSON.stringify(commitPattern)}
    
    Return ONLY a valid JSON object with the following fields:
    - personality_summary (string)
    - archetype (string)
    - top_strengths (array of 3 strings)
    - blind_spot (string)
    - recruiter_pitch (string)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personality_summary: { type: Type.STRING },
            archetype: { type: Type.STRING },
            top_strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            blind_spot: { type: Type.STRING },
            recruiter_pitch: { type: Type.STRING }
          },
          required: ["personality_summary", "archetype", "top_strengths", "blind_spot", "recruiter_pitch"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini API returned an empty response.");
    }

    const analysis: GeminiAnalysis = JSON.parse(text);
    
    // Additional validation
    if (
      !analysis.personality_summary ||
      !analysis.archetype ||
      !Array.isArray(analysis.top_strengths) ||
      analysis.top_strengths.length !== 3 ||
      !analysis.blind_spot ||
      !analysis.recruiter_pitch
    ) {
      throw new Error("Gemini API returned invalid JSON structure.");
    }

    return analysis;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Failed to analyze profile: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
