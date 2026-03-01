import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import catchlightCalendar from '../../../lib/catchlight-calendar.json';
import { AUTHOR_VOICE } from '../../../lib/career-data';
import { findMatchingInsights } from '../../../lib/insight-matcher';

export const maxDuration = 120;

export async function POST(request) {
  try {
    const { weekNumber, articleContent, instruction, chatHistory = [] } = await request.json();

    if (!articleContent) {
      return NextResponse.json({ error: 'articleContent is required' }, { status: 400 });
    }
    if (!instruction) {
      return NextResponse.json({ error: 'instruction is required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Load Light data for context matching
    const lightData = catchlightCalendar.weeks.find(w => w.week === weekNumber);
    const matchedInsights = findMatchingInsights(lightData?.sources || []);

    // Build knowledge context
    const knowledgeContext = matchedInsights.length > 0
      ? matchedInsights.map(ins =>
          `- ${ins.source.author}, "${ins.source.book}" — ${ins.framework}: ${ins.insight.substring(0, 300)}`
        ).join('\n')
      : 'No specific matched insights for this week. Use general marketing science knowledge.';

    const systemPrompt = `You are an expert editorial assistant for the Catchlight newsletter — "where AI visibility meets the science of attention."

${AUTHOR_VOICE}

ARTICLE STRUCTURE (for reference):
- Hook (opening provocation, no header)
- **The Research** (cite specific researchers, numbers, studies)
- **The Framework** (actionable mental model)
- **The Bridge** (connect research to practice)
- **The Implication** (what this means for marketing teams)
- Coda (closing thought, question, or call to subscribe)

KNOWLEDGE LIBRARY CONTEXT:
${knowledgeContext}

EDITING PRINCIPLES:
- Preserve the author's voice — direct, practitioner-grounded, research-first
- When making changes, briefly explain WHY (cite research or writing principles)
- Maintain all source attributions — never remove or fabricate citations
- Keep articles between 2500-3500 words unless the user requests otherwise
- Never use banned phrases: "In today's rapidly evolving...", "Let's dive in", "Game-changer", "Landscape", "Buckle up", "It's not just about...", "At the end of the day"

RESPONSE FORMAT:
First, provide a brief explanation of what you changed and why (2-5 sentences).
Then output the separator line exactly as shown: ---REVISED_ARTICLE---
Then output the complete revised article text.

If the user asks a question or requests feedback rather than an edit, respond conversationally without the separator or revised article. Only include ---REVISED_ARTICLE--- when you are providing an actual rewrite.`;

    // Build messages: first message includes the article, then chat history, then new instruction
    const messages = [];

    // Initial context with the article
    messages.push({
      role: 'user',
      content: `Here is the current article I want to edit:\n\n${articleContent}`,
    });
    messages.push({
      role: 'assistant',
      content: 'I\'ve read the article. What changes would you like me to make?',
    });

    // Append chat history (last 10 exchanges)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // The new instruction is already the last user message in chatHistory,
    // but if it's not, add it
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'user' || lastMsg.content !== instruction) {
      messages.push({ role: 'user', content: instruction });
    }

    // Stream the response
    const response = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Edit endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
