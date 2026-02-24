# summarizer.py
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import ollama
from markdown_pdf import MarkdownPdf, Section
import nltk
from nltk.tokenize import sent_tokenize
from typing import Dict, List, Optional, Tuple

MODEL_NAME = "gemma2:2b-instruct-q4_0"
MAX_PARALLEL_LLM = 4


# ============================================================================
# STAGE 1: Transcript Segmentation
# ============================================================================

def segment_text(text, target_words=2500, window=50):
    sentences = sent_tokenize(text)
    segments = []
    current_segment = []
    word_count = 0
    
    for sentence in sentences:
        sent_words = len(sentence.split())
        
        if word_count + sent_words > target_words + window and current_segment:
            segments.append(' '.join(current_segment))
            current_segment = [sentence]
            word_count = sent_words
        else:
            current_segment.append(sentence)
            word_count += sent_words
    
    if current_segment:
        segments.append(' '.join(current_segment))
    
    return segments



# ============================================================================
# STAGE 2: CONTENT EXTRACTION
# ============================================================================


def _extract_actions(transcript: str) -> str:
    prompt = f"""Extract all action items, tasks, or to-dos from this transcript.
For each item, include who is responsible if mentioned.
List each as a single line starting with a dash.
If none exist, respond with "None identified." Use complete and descriptive sentences.

Transcript:
{transcript}

Action items:"""
    return ollama.generate(
        model=MODEL_NAME,
        prompt=prompt,
        options={"num_predict": 100, "temperature": 0.3}
    ).get("response", "").strip()


def _extract_decisions(transcript: str) -> str:
    prompt = f"""Extract all decisions, conclusions, or agreements from this transcript.
Be specific and concise - one line per decision starting with a dash.
If none exist, respond with "None identified". Use complete and descriptive sentences.

Transcript:
{transcript}

Decisions:"""
    return ollama.generate(
        model=MODEL_NAME,
        prompt=prompt,
        options={"num_predict": 100, "temperature": 0.3}
    ).get("response", "").strip()


def _extract_topics(transcript: str) -> str:
    prompt = f"""List the 3-5 main topics discussed in this meeting.
Be specific - mention projects, problems, or subjects by name.
One line per topic starting with a dash. Use complete and descriptive sentences. 

Transcript:
{transcript}

Main topics:"""
    return ollama.generate(
        model=MODEL_NAME,
        prompt=prompt,
        options={"num_predict": 150, "temperature": 0.4}
    ).get("response", "").strip()


def extract_content_structure(transcript: str) -> Dict[str, any]:
    """
    First pass: Analyze the transcript to identify key content elements.
    Runs actions, decisions, and topics extraction in parallel.
    """
    with ThreadPoolExecutor(max_workers=3) as ex:
        actions_future = ex.submit(_extract_actions, transcript)
        decisions_future = ex.submit(_extract_decisions, transcript)
        topics_future = ex.submit(_extract_topics, transcript)
        action_items = actions_future.result()
        decisions = decisions_future.result()
        topics = topics_future.result()

    return {
        "action_items": action_items,
        "decisions": decisions,
        "topics": topics,
        "transcript_length": len(transcript)
    }




# ============================================================================
# STAGE 3: Summary Generation
# ============================================================================

def generate_summary(transcript: str) -> str:
    """Generate a concise 2-3 sentence summary - high level only."""
    
    summary_prompt = f"""Write a concise 3-5 sentence summary of this meeting.
Focus on the main purpose and outcome - do NOT list specific decisions or action items.

Transcript:
{transcript}

Summary (2-3 sentences only):"""
    
    result = ollama.generate(
        model=MODEL_NAME,
        prompt=summary_prompt,
        options={"num_predict": 150, "temperature": 0.5}
    )
    
    summary = result.get("response", "").strip()
        
    return summary

# ============================================================================
# Merge Summaries & Title
# ============================================================================

def _generate_title(text: str) -> str:
    """Generate a concise title from summary text."""
    prompt = f"""Generate a concise but descriptive title for this meeting. Only return the title.

Summary:
{text}

Title:"""
    result = ollama.generate(
        model=MODEL_NAME,
        prompt=prompt,
        options={"num_predict": 30, "temperature": 0.3}
    )
    return result.get("response", "").strip()


def _stitch_and_title(segment_summaries: list) -> Tuple[str, str]:
    """
    Combine segment summaries and generate title in one LLM call.
    Returns (final_summary, title).
    """
    prompt = f"""You are given segment summaries of a meeting. Combine them into one coherent summary and generate a title.

Respond with exactly two lines in this format:
SUMMARY: [3-5 sentence combined summary - do NOT list action items or decisions]
TITLE: [concise meeting title]

Segment Summaries:
{chr(10).join(segment_summaries)}

Response:"""
    result = ollama.generate(
        model=MODEL_NAME,
        prompt=prompt,
        options={"num_predict": 200, "temperature": 0.4}
    )
    response = result.get("response", "").strip()

    # Parse SUMMARY: and TITLE: lines
    summary, title = "", ""
    for line in response.split("\n"):
        line = line.strip()
        if line.upper().startswith("SUMMARY:"):
            summary = line[8:].strip()
        elif line.upper().startswith("TITLE:"):
            title = line[6:].strip()

    if not summary:
        summary = " ".join(segment_summaries)
    if not title:
        title = _generate_title(summary)
    return summary, title

# ============================================================================
# STAGE 5: Assemble
# ============================================================================
def assemble(summary: str, merged: Dict[str, List[str]]) -> str:
    merged["action_items"] = [x for x in merged.get("action_items", []) if "none identified" not in x.lower()]
    merged["decisions"] = [x for x in merged.get("decisions", []) if "none identified" not in x.lower()]
    merged["topics"] = [x for x in merged.get("topics", []) if "none identified" not in x.lower()]

    def format_section(items: List[str]) -> str:
        lines = []
        for line in items:
            line = line.strip()
            if not line:
                continue
            if not line.startswith('-'):
                line = f"- {line.lstrip('* ').lstrip()}"
            lines.append(line)
        return '\n'.join(lines) if lines else "None identified."

    actions_text = format_section(merged["action_items"])
    decisions_text = format_section(merged["decisions"])
    topics_text = format_section(merged["topics"])

    return (
        f"**Summary:**\n{summary}\n\n"
        f"**Action Items:**\n{actions_text}\n\n"
        f"**Decisions:**\n{decisions_text}\n\n"
        f"**Topics:**\n{topics_text}"
    )


    





def markdown_to_pdf(markdown_content: str, output_pdf_path: str, title: str, date_time: str) -> None:
    """Convert markdown notes to PDF - unchanged."""
    full_markdown = f"""# {title}

**Generated:** {date_time}

---

{markdown_content}
"""
    pdf = MarkdownPdf()
    pdf.add_section(Section(full_markdown))
    pdf.save(output_pdf_path)

def _process_segment(seg: str) -> Tuple[Dict[str, any], str]:
    """Extract structure and generate summary for one segment. Used for parallel execution."""
    structure = extract_content_structure(seg)
    summary = generate_summary(seg)
    return structure, summary


def save_summary_as_pdf(transcript: str, output_pdf_path: str) -> str:
    """
    Summarize transcript, extract title, and save as PDF.
    Uses parallel LLM calls to reduce latency on multi-core systems.
    Returns: meeting_title (for filename use)
    """
    # STAGE 0: Split into segments
    segments = segment_text(transcript)

    # STAGE 1 & 3: Process all segments in parallel (extract + summary per segment)
    n_segments = len(segments)
    structures: List[Dict[str, any]] = [None] * n_segments
    segment_summaries: List[str] = [None] * n_segments

    with ThreadPoolExecutor(max_workers=min(MAX_PARALLEL_LLM, n_segments)) as ex:
        future_to_idx = {ex.submit(_process_segment, seg): i for i, seg in enumerate(segments)}
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            structure, summary = future.result()
            structures[idx] = structure
            segment_summaries[idx] = summary

    # Merge each category across segments in order
    merged = {"action_items": [], "decisions": [], "topics": []}
    for s in structures:
        merged["action_items"].extend(s["action_items"].splitlines())
        merged["decisions"].extend(s["decisions"].splitlines())
        merged["topics"].extend(s["topics"].splitlines())

    # Final summary and title: skip stitch for 1–2 segments, combine stitch+title for 3+
    n_segments = len(segment_summaries)
    if n_segments == 1:
        final_summary = segment_summaries[0]
        title = _generate_title(final_summary)
    elif n_segments == 2:
        final_summary = " ".join(segment_summaries)
        title = _generate_title(final_summary)
    else:
        final_summary, title = _stitch_and_title(segment_summaries)

    notes_text = assemble(final_summary, merged)

    
        

    
    #title, notes = summarize_and_extract_title(transcript)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    markdown_to_pdf(notes_text, output_pdf_path, title, now)
    return title


