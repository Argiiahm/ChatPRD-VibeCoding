import { GoogleGenerativeAI } from "@google/generative-ai";
import { UsageTracker } from "./usage";

const SYSTEM_INSTRUCTION = `You are an expert Product Manager and Solutions Architect AI.
Your ONLY job is to generate a comprehensive PRD (Product Requirement Document) and a Mermaid flowchart that are 100% relevant to the user's specific idea.

RULES:
1. EVERYTHING you write must directly relate to the user's product idea. Do NOT generate generic content.
2. Use the user's own keywords and terminology throughout.
3. The PRD title must reflect the user's product name/idea.
4. IMPORTANT: Keep answers concise but complete. Avoid unnecessary verbosity.

OUTPUT FORMAT (follow strictly):

## PRD
### 1. Objective
[Write a clear objective specific to the user's idea]

### 2. Problem Statement
[Describe the exact problem the user's product solves]

### 3. Solution Overview
[Describe how the user's product solves the problem]

### 4. Features List
[List features specific to the user's idea, grouped by phase if appropriate]

### 5. User Flow
[Step-by-step user flow specific to the user's product]

### 6. Technical Suggestions
[Tech stack and architecture recommendations relevant to the user's idea]

### 7. Database Schema Recommendation
[Detailed database tables using Markdown tables with columns: Column, Type, Constraints, Description. Make tables specific to the user's product domain.]

## FLOW_DIAGRAM
\`\`\`mermaid
[Mermaid flowchart specific to the user's product flow]
\`\`\`

MERMAID STRICT RULES (v11):
- Start with: flowchart TD
- Use ONLY alphanumeric IDs (A, B, C1).
- ALL labels MUST be wrapped in double-quoted brackets: A["Label Text"]
- Connections: A --> B or A -->|"Label"| B
- Subgraphs: subgraph ID["Label"] ... end
- NEVER use special characters like &, ?, !, /, (), in IDs.
- In Labels, use "and" instead of &.
- Keep diagrams simple and focused on the user's logic.`;

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private static lastRequestTime = 0;

  constructor(apiKey: string, modelName: string = "gemini-2.0-flash") {
    this.genAI = new GoogleGenerativeAI(apiKey.trim());
    this.modelName = modelName;
  }

  private getModel(modelName?: string) {
    return this.genAI.getGenerativeModel({
      model: modelName || this.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  async generatePRD(prompt: string, template?: string, retries = 5) {
    const userMessage = template
      ? `Product Category: ${template}\n\nProduct Idea: ${prompt}\n\nGenerate a complete PRD and flow diagram for this specific product idea.`
      : `Product Idea: ${prompt}\n\nGenerate a complete PRD and flow diagram for this specific product idea.`;

    // 1. Global cooldown (anti-spam) - minimal 2 detik antar request
    const now = Date.now();
    const diff = now - GeminiService.lastRequestTime;
    if (diff < 2000) {
      const wait = 2000 - diff;
      console.log(`Global cooldown active. Waiting ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
    GeminiService.lastRequestTime = Date.now();

    let attempt = 0;

    while (attempt < retries) {
      try {
        // 2. Burst limit protection (extra check)
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 1000));
        }

        // 3. Jangan reuse model instance lama
        const currentModel = this.getModel();
        
        const result = await currentModel.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();

        UsageTracker.logRequest('success', this.modelName);
        return this.parseResponse(text);
      } catch (error: any) {
        attempt++;
        const isRateLimit = error?.message?.includes("429") || error?.message?.includes("quota");
        
        UsageTracker.logRequest('error', this.modelName, error?.message);
        console.error(`Gemini API Error (Attempt ${attempt}/${retries}):`, error);

        if (attempt >= retries) {
          throw error;
        }

        // 4. Handle 429 (Stop brutal retry)
        if (isRateLimit) {
          console.log("Rate limit hit (429). Waiting 20s and stopping...");
          await new Promise(r => setTimeout(r, 20000));
          // Jangan loop terus jika kena 429, informasikan ke user
          throw new Error("Batas penggunaan (Rate Limit) tercapai. Tunggu 60 detik sebelum mencoba lagi.");
        } else {
          // 4. Exponential backoff untuk error lain: 2s, 4s, 8s
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Waiting ${delay}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  private parseResponse(text: string) {
    let prd = text;
    let mermaidText = "";

    const prdMatch = text.match(/## PRD([\s\S]*?)## FLOW_DIAGRAM/i);
    if (prdMatch) {
      prd = prdMatch[1].trim();
    }

    const flowDiagramIndex = text.toUpperCase().indexOf("## FLOW_DIAGRAM");
    if (flowDiagramIndex !== -1) {
      const flowSection = text.slice(flowDiagramIndex);
      const diagramMatch = flowSection.match(/```(?:mermaid)?\s*\n([\s\S]*?)```/i);
      if (diagramMatch) {
        mermaidText = diagramMatch[1].trim();
      } else {
        mermaidText = flowSection.replace(/## FLOW_DIAGRAM/i, "").trim();
      }
    } else {
      const fallbackDiagramMatch = text.match(/```mermaid\s*\n([\s\S]*?)```/i);
      if (fallbackDiagramMatch) {
        mermaidText = fallbackDiagramMatch[1].trim();
      }
    }

    return {
      prd: prd,
      mermaid: mermaidText,
      raw: text
    };
  }
}

