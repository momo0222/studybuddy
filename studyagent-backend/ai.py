import os
import anthropic
from textwrap import wrap

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MAX_CHARS = 8000  # safe chunk size for Claude Sonnet

def chunk_text(text, max_chars=MAX_CHARS):
    """
    Split text into safe chunks by characters.
    """
    return wrap(text, max_chars)

def rewrite_notes(raw_text: str) -> str:
    """
    Uses AI to rewrite raw lecture text into clean structured Markdown notes
    """
    prompt = f"""
    Convert the following messy lecture notes into clean, well-structured Markdown format.

    Requirements:
    - Use proper Markdown headers (# for main topics, ## for subtopics)
    - Format ALL mathematical expressions using proper LaTeX syntax enclosed in $ for inline math or $$ for display math
    - Convert mathematical symbols to proper LaTeX: ℝ² → $\\mathbb{{R}}^2$, √ → $\\sqrt{{}}$, vectors → $\\vec{{v}}$, etc.
    - Use bullet points (-) for lists
    - Use **bold** for emphasis
    - Organize content logically with clear sections
    - Fix any OCR errors or typos, especially garbled mathematical symbols
    - Preserve all mathematical content and examples with proper LaTeX formatting
    - For complex expressions, use display math ($$...$$) on separate lines
    - Use proper LaTeX for Greek letters: θ → $\\theta$, λ → $\\lambda$, etc.

    Examples of proper math formatting:
    - Coordinate systems: $\\mathbb{{R}}^2$, $\\mathbb{{R}}^3$
    - Vectors: $\\vec{{v}}$, $\\vec{{u}}$
    - Vector length: $||\\vec{{v}}|| = \\sqrt{{a^2 + b^2}}$
    - Unit vectors: $\\hat{{i}} = (1,0)$, $\\hat{{j}} = (0,1)$
    - Equations: $a^2 + b^2 = 1$

    Raw notes to convert:
    {raw_text}

    Return ONLY the formatted Markdown content with proper LaTeX math, no explanations.
    """
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",  # Use the correct model name
            max_tokens=4000,  # Increase token limit for better formatting
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        )
        return response.content[0].text.strip()
    except Exception as e:
        print(f"[AI ERROR] {e}")
        return raw_text


def summarize_text(text: str) -> dict:
    """Send text to Claude and return cleaned + summarized version."""
    cleaned = " ".join(text.split())

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",  # Use the correct model name
            max_tokens=500,
            messages=[
                {
                    "role": "user",
                    "content": f"Summarize the following notes into 5-10 concise bullet points:\n\n{text}"
                }
            ],
        )

        summary_text = ""
        if response.content and len(response.content) > 0:
            summary_text = response.content[0].text.strip()

        summary_list = [line.strip("-• ") for line in summary_text.split("\n") if line.strip()]

        if not summary_list:
            summary_list = ["Summary unavailable."]

        return {
            "cleaned": cleaned,
            "summary": summary_list
        }

    except Exception as e:
        print(f"[AI ERROR] {e}")
        return {"cleaned": cleaned, "summary": ["Summary unavailable."]}
def process_long_text(text: str) -> dict:
    """
    Handles long lecture notes by splitting into chunks.
    Each chunk gets rewritten + summarized, then merged.
    """
    chunks = chunk_text(text)
    rewritten_chunks = []
    summary_chunks = []

    for i, chunk in enumerate(chunks, 1):
        print(f"[AI] Processing chunk {i}/{len(chunks)} ({len(chunk)} chars)")
        rewritten = rewrite_notes(chunk)
        rewritten_chunks.append(rewritten)

        summary = summarize_text(rewritten)["summary"]
        summary_chunks.extend(summary)

    merged_rewritten = "\n\n---\n\n".join(rewritten_chunks)

    return {
        "cleaned": merged_rewritten,
        "summary": summary_chunks
    }