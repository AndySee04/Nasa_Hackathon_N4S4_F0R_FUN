"""Child-safety checks for Astro AI.

These are simple, transparent rules that run BEFORE any AI model sees a message and AFTER it replies.
They are a first line of defence, not a guarantee, which is why the system prompt also sets boundaries
and why the UI reminds children not to share personal information.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse

PII_PATTERNS = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"), "an email address"),
    (re.compile(r"(?:\+?\d[\s-]?){8,}"), "a phone number"),
    (re.compile(r"\b(i live (at|on|in)|my (home )?address|my street|my house is)\b", re.I), "where you live"),
    (re.compile(r"\b(my password|password is|my pin)\b", re.I), "a password"),
    (re.compile(r"\b(my (full )?name is|i am called|my school is|i go to .{0,30}school)\b", re.I), "personal details"),
]

SELF_HARM = re.compile(r"\b(kill myself|hurt myself|suicide|self[- ]?harm|want to die|end my life)\b", re.I)

UNSAFE_TOPICS = re.compile(
    r"\b(bomb|weapon|gun|shoot (someone|people)|kill (someone|people|him|her)|drugs?|porn|sex|nude|"
    r"hack (into|someone)|steal|(make|build|making|building) (an? )?explosives?)\b"
    # "naked" only when it isn't the astronomy phrase "naked eye".
    r"|\bnaked\b(?! eye)",
    re.I,
)

# Questions about how Astro works inside. Answered kindly, without revealing anything.
SECRET_REQUEST = re.compile(
    r"\b(system prompt|your (prompt|instructions|rules you were given|hidden rules)|api[ -]?keys?|secret keys?|access tokens?|"
    r"env(ironment)? (file|variables?)|\.env\b|backend code|source code|server code|show me your code)",
    re.I,
)

INJECTION = re.compile(
    r"(ignore (all |your |the )?(previous|above|earlier) (instructions|rules)|system prompt|pretend (to be|you are)|"
    r"jailbreak|developer mode|run this code|sudo |rm -rf)",
    re.I,
)

ALLOWED_LINK_DOMAINS = ("nasa.gov", "si.edu", "esa.int", "jpl.nasa.gov")


@dataclass
class SafetyResult:
    allowed: bool
    reply: str | None = None
    note: str | None = None


def check_message(text: str) -> SafetyResult:
    """Decide whether a child's message can be answered, and how to respond if not."""
    if SELF_HARM.search(text):
        return SafetyResult(
            allowed=False,
            reply=(
                "I'm really glad you told me. I'm only a space robot, so I can't help with this the way a person can. "
                "Please talk to a grown-up you trust right now, like a parent, teacher or school counsellor. "
                "If you are in danger, ask an adult to contact your local emergency number. You matter. 💙"
            ),
            note="Astro suggested talking to a trusted adult.",
        )

    for pattern, what in PII_PATTERNS:
        if pattern.search(text):
            return SafetyResult(
                allowed=False,
                reply=(
                    f"Whoa, it looks like your message might include {what}. For your safety, please don't share personal "
                    "information with me or anyone online. Let's get back to space! What would you like to explore?"
                ),
                note="Message not processed because it may contain personal information.",
            )

    if SECRET_REQUEST.search(text):
        return SafetyResult(
            allowed=False,
            reply=(
                "I'm here to help you explore space! I can't share private system instructions, but I can explain "
                "how my space-learning features work: I answer from facts checked against NASA sources, and I say "
                "when I'm not sure. What would you like to explore?"
            ),
            note="Astro keeps its private settings private.",
        )

    if INJECTION.search(text):
        return SafetyResult(
            allowed=False,
            reply="I'm Astro, and I'm built to explore space with you, so I'll keep being me! 🚀 Ask me about a rover, a probe or a space word.",
            note="Astro stays in its role as a space guide.",
        )

    if UNSAFE_TOPICS.search(text):
        return SafetyResult(
            allowed=False,
            reply=(
                "That's not something I can help with. I'm a space guide! Here's something cool instead: the Voyager "
                "probes carry golden records with music and greetings from Earth. Want to hear about them?"
            ),
            note="Astro only talks about space and science.",
        )

    return SafetyResult(allowed=True)


_URL = re.compile(r"https?://[^\s)\]>\"']+")


def _allowed_url(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(host == d or host.endswith("." + d) for d in ALLOWED_LINK_DOMAINS)


def echoes_instructions(reply: str, instructions: str, window: int = 8) -> bool:
    """True if the reply repeats any run of `window` words from Astro's own instructions."""
    words = re.findall(r"[a-z0-9']+", instructions.lower())
    grams = {" ".join(words[i : i + window]) for i in range(len(words) - window + 1)}
    reply_words = re.findall(r"[a-z0-9']+", reply.lower())
    return any(" ".join(reply_words[i : i + window]) in grams for i in range(len(reply_words) - window + 1))


def strip_unregistered_links(text: str, is_allowed) -> str:
    """Removes any link that isn't in the knowledge base's source registry."""
    return _URL.sub(lambda m: m.group(0) if is_allowed(m.group(0).rstrip(".,;:!?")) else "[link removed]", text)


def sanitize_reply(text: str, max_chars: int = 1200) -> str:
    """Remove links to sites outside the allow-list and keep replies short."""
    cleaned = _URL.sub(lambda m: m.group(0) if _allowed_url(m.group(0)) else "[link removed]", text).strip()
    if len(cleaned) > max_chars:
        cleaned = cleaned[:max_chars].rsplit(" ", 1)[0] + "…"
    return cleaned
