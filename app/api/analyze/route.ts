import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a restaurant receipt parser. Analyze this receipt image carefully.

Return ONLY valid JSON — no markdown fences, no explanation, nothing else.

Required format:
{
  "items": [
    { "name": "Item name", "price": 12.50 }
  ],
  "subtotal": 45.00,
  "tax": 3.60,
  "tip": 0,
  "total": 48.60
}

Rules:
- Include every food and drink line item with its exact price
- Do NOT include tax, tip, or total as items
- Set tip to 0 if not shown on receipt
- subtotal should equal the sum of all item prices
- Be precise — use the exact dollar amounts shown`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: (mediaType as "image/jpeg" | "image/png" | "image/webp") || "image/jpeg",
        },
      },
      prompt,
    ]);

    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Receipt parse error:", err);
    const message = err instanceof Error ? err.message : "Failed to parse receipt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
