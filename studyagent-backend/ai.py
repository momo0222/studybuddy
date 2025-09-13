# import os, json
# from anthropic import Anthropic

# client = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))

# def summarize_text(text: str) -> dict:
#     prompt = f"""
#     Clean up and preserve the content of these notes for readability. 
#     Return JSON with keys: cleaned, summary.

#     Notes:
#     {text}


#     Response ONLY in JSON
#     """

#     try:
#         resp = client.messages.create(
#              model="claude-sonnet-4-20250514",
#             max_tokens=1000,
#             messages=[
#                 {
#                     "role": "user",
#                     "content": prompt
#                 }
#             ]
#         )
#         return json.loads(resp.content[0].text)
#     except Exception:
#         # fallback if Claude fails
#         return {"cleaned": text, "summary": ["Summary unavailable."]}
# ai.py
import os
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def summarize_text(text: str) -> dict:
    """Send text to Claude and return cleaned + summarized version."""
    cleaned = " ".join(text.split())

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",  # latest stable model
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
