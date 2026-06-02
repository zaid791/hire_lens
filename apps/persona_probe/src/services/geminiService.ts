import {
  GitHubProfile,
  GitHubRepo,
  LanguageStat,
  CommitPattern,
  GeminiAnalysis
} from '../types/index';

export async function analyzeWithGemini(
  profile: GitHubProfile,
  repos: GitHubRepo[],
  languageStats: LanguageStat[],
  commitPattern: CommitPattern
): Promise<GeminiAnalysis> {

  const prompt = `
Analyze the following GitHub developer profile and return ONLY valid JSON.

Return format:
{
  "personality_summary": string,
  "archetype": string,
  "top_strengths": [string, string, string],
  "blind_spot": string,
  "recruiter_pitch": string
}

Rules:
- Return ONLY JSON (no markdown, no text)
- top_strengths MUST be array of 3 strings
- no extra keys

Profile: ${JSON.stringify(profile)}
Repositories: ${JSON.stringify(repos)}
Language Statistics: ${JSON.stringify(languageStats)}
Commit Pattern: ${JSON.stringify(commitPattern)}
`;

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tinyllama", // możesz zmienić np. llama3, mistral
        messages: [
          {
            role: "system",
            content: "You are a strict JSON API. Output ONLY valid JSON. No explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.message?.content;

    if (!rawText) {
      throw new Error("Ollama returned empty response.");
    }

    // 🔧 SAFE JSON PARSING (z fallbackiem)
    let parsed: any;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.warn("Raw malformed JSON:", rawText);

      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("No JSON found in model response.");
      }

      parsed = JSON.parse(match[0]);
    }

    // 🧠 NORMALIZACJA (KLUCZ DO STABILNOŚCI)
    const analysis: GeminiAnalysis = {
      personality_summary: parsed.personality_summary ?? "Unknown",
      archetype: parsed.archetype ?? "Unknown",
      top_strengths: Array.isArray(parsed.top_strengths)
        ? parsed.top_strengths.slice(0, 3)
        : [],
      blind_spot: parsed.blind_spot ?? "Unknown",
      recruiter_pitch: parsed.recruiter_pitch ?? "Unknown"
    };

    // 🔧 padding do dokładnie 3 elementów
    while (analysis.top_strengths.length < 3) {
      analysis.top_strengths.push("N/A");
    }

    return analysis;

  } catch (error) {
    console.error("Ollama error:", error);
    throw new Error(
      `Failed to analyze profile: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}