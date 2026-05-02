import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `You are an expert Product Manager and Solutions Architect AI.
Your ONLY job is to generate a comprehensive PRD (Product Requirement Document) and a Mermaid flowchart that are 100% relevant to the user's specific idea.

RULES:
1. EVERYTHING you write must directly relate to the user's product idea. Do NOT generate generic content.
2. Use the user's own keywords and terminology throughout.
3. The PRD title must reflect the user's product name/idea.

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

    let attempt = 0;
    const currentModel = this.getModel();

    while (attempt < retries) {
      try {
        const result = await currentModel.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();

        return this.parseResponse(text);
      } catch (error: any) {
        attempt++;
        console.error(`Gemini API Error (Attempt ${attempt}/${retries}):`, error);

        if (attempt >= retries) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Waiting ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
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

