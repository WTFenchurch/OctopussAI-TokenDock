"""
Smart Router — Task-Aware Model Selection
==========================================
Classifies incoming prompts by complexity, then routes
to the cheapest capable free-tier model via LiteLLM.

Usage:
  from smart_router import route_request, SmartRouter

  # One-shot
  response = route_request("What is 2+2?")

  # Or use the router directly
  router = SmartRouter()
  tier = router.classify("Write a 500-word essay on AI ethics")  # -> "complex"
  response = router.complete("Write a 500-word essay on AI ethics")
"""

import os
import re
import json
import time
import datetime
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ── Tier Definitions ──
# Each tier maps to a model_name in litellm_config.yaml

TIERS = {
    "simple": {
        "description": "Classification, extraction, formatting, yes/no, short Q&A, translation",
        "max_tokens": 256,
        "token_cap_per_day": 50_000,  # conserve even free tokens
    },
    "medium": {
        "description": "Multi-step reasoning, analysis, structured output, detailed Q&A",
        "max_tokens": 1024,
        "token_cap_per_day": 100_000,
    },
    "complex": {
        "description": "Long-form writing, deep analysis, planning, creative tasks",
        "max_tokens": 4096,
        "token_cap_per_day": 200_000,
    },
    "code": {
        "description": "Code generation, debugging, refactoring, code review",
        "max_tokens": 2048,
        "token_cap_per_day": 150_000,
    },
}

# ── Classification Heuristics ──
# Fast local classification — no tokens spent on routing decisions

CODE_SIGNALS = re.compile(
    r"(write|generate|debug|fix|refactor|implement|code|function|class|module|script|api|endpoint|"
    r"test|unittest|pytest|bug|error|traceback|syntax|compile|import|def |return |console\.log|"
    r"```|\.py|\.js|\.ts|\.go|\.rs|\.java|html|css|sql|regex|algorithm)",
    re.IGNORECASE,
)

COMPLEX_SIGNALS = re.compile(
    r"(essay|article|write .{20,}|analyze .{20,}|explain in detail|compare and contrast|"
    r"pros and cons|strategy|plan|design|architecture|comprehensive|thorough|"
    r"step.by.step .{30,}|outline .{20,}|evaluate|critique|review .{20,}|"
    r"multiple paragraph|long.form|in depth|500.word|1000.word)",
    re.IGNORECASE,
)

MEDIUM_SIGNALS = re.compile(
    r"(explain |compare |how does |how do |describe .{15,}|what are the |"
    r"differences between|advantages |disadvantages |trade.?offs|"
    r"when should|why does|walk me through|break down )",
    re.IGNORECASE,
)

SIMPLE_SIGNALS = re.compile(
    r"(^(yes|no|true|false)\??\s*$|what is |define |translate |convert |"
    r"list |name |count |how many|format |extract |classify |label |"
    r"summarize .{0,50}$|tldr|one.word|short answer|briefly|in a word)",
    re.IGNORECASE,
)


def classify_task(prompt: str) -> str:
    """Classify a prompt into a routing tier using zero-cost heuristics."""
    prompt = prompt.strip()
    msg_len = len(prompt)

    # Very short prompts are almost always simple
    if msg_len < 50 and not CODE_SIGNALS.search(prompt):
        return "simple"

    # Code detection takes priority — route to code-specialized models
    code_matches = len(CODE_SIGNALS.findall(prompt))
    if code_matches >= 2 or (code_matches >= 1 and ("```" in prompt or "def " in prompt)):
        return "code"

    # Complex detection
    if COMPLEX_SIGNALS.search(prompt) or msg_len > 500:
        return "complex"

    # Medium detection — reasoning, comparison, explanation
    if MEDIUM_SIGNALS.search(prompt) or msg_len > 200:
        return "medium"

    # Simple detection
    if SIMPLE_SIGNALS.search(prompt) or msg_len < 120:
        return "simple"

    # Default to medium — capable but not wasteful
    return "medium"


class TokenBudget:
    """Tracks daily token usage per tier to prevent waste."""

    def __init__(self, budget_file: str = None):
        self.budget_file = budget_file or str(
            Path(__file__).parent / ".token_budget.json"
        )
        self.usage = self._load()

    def _load(self) -> dict:
        today = datetime.date.today().isoformat()
        try:
            with open(self.budget_file) as f:
                data = json.load(f)
                if data.get("date") != today:
                    return {"date": today, "tiers": {}}
                return data
        except (FileNotFoundError, json.JSONDecodeError):
            return {"date": today, "tiers": {}}

    def _save(self):
        with open(self.budget_file, "w") as f:
            json.dump(self.usage, f, indent=2)

    def record(self, tier: str, tokens_used: int):
        if tier not in self.usage["tiers"]:
            self.usage["tiers"][tier] = {"tokens": 0, "requests": 0}
        self.usage["tiers"][tier]["tokens"] += tokens_used
        self.usage["tiers"][tier]["requests"] += 1
        self._save()

    def remaining(self, tier: str) -> int:
        cap = TIERS.get(tier, {}).get("token_cap_per_day", 100_000)
        used = self.usage.get("tiers", {}).get(tier, {}).get("tokens", 0)
        return max(0, cap - used)

    def is_over_budget(self, tier: str) -> bool:
        return self.remaining(tier) <= 0

    def summary(self) -> dict:
        result = {}
        for tier, info in TIERS.items():
            used = self.usage.get("tiers", {}).get(tier, {}).get("tokens", 0)
            reqs = self.usage.get("tiers", {}).get(tier, {}).get("requests", 0)
            cap = info["token_cap_per_day"]
            result[tier] = {
                "used": used,
                "cap": cap,
                "remaining": max(0, cap - used),
                "requests": reqs,
                "pct_used": round(used / cap * 100, 1) if cap > 0 else 0,
            }
        return result


class SmartRouter:
    """Task-aware router that classifies prompts and routes to cheapest capable model."""

    def __init__(self, litellm_base: str = None, litellm_key: str = None):
        self.base = litellm_base or f"http://localhost:{os.getenv('LITELLM_PORT', '4000')}"
        self.key = litellm_key or os.getenv("LITELLM_MASTER_KEY", "sk-local-dev-key-change-me")
        self.client = OpenAI(base_url=f"{self.base}/v1", api_key=self.key)
        self.budget = TokenBudget()

    def classify(self, prompt: str) -> str:
        """Classify prompt into tier."""
        tier = classify_task(prompt)

        # If this tier is over budget, downgrade to save tokens
        if self.budget.is_over_budget(tier):
            if tier == "complex":
                tier = "medium"
            elif tier == "medium":
                tier = "simple"
            # simple and code don't downgrade — they're already minimal

        return tier

    def complete(self, prompt: str, system: str = None, tier_override: str = None, **kwargs) -> dict:
        """Route a prompt to the cheapest capable model and return the response."""
        tier = tier_override or self.classify(prompt)
        max_tokens = min(
            kwargs.pop("max_tokens", TIERS[tier]["max_tokens"]),
            TIERS[tier]["max_tokens"],
        )

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        start = time.time()
        response = self.client.chat.completions.create(
            model=tier,
            messages=messages,
            max_tokens=max_tokens,
            **kwargs,
        )
        elapsed = time.time() - start

        # Track usage
        usage = response.usage
        total_tokens = (usage.prompt_tokens or 0) + (usage.completion_tokens or 0) if usage else 0
        self.budget.record(tier, total_tokens)

        return {
            "content": response.choices[0].message.content,
            "tier": tier,
            "model": response.model,
            "tokens": total_tokens,
            "time": round(elapsed, 2),
            "budget_remaining": self.budget.remaining(tier),
        }

    def budget_report(self) -> str:
        """Human-readable budget summary."""
        summary = self.budget.summary()
        lines = ["\n  Daily Token Budget Report", "  " + "=" * 40]
        for tier, info in summary.items():
            bar_len = 20
            filled = int(info["pct_used"] / 100 * bar_len)
            bar = "\u2588" * filled + "\u2591" * (bar_len - filled)
            lines.append(
                f"  {tier:<8} [{bar}] {info['pct_used']:>5.1f}%  "
                f"({info['used']:,}/{info['cap']:,} tokens, {info['requests']} reqs)"
            )
        return "\n".join(lines)


# ── Convenience function ──

def route_request(prompt: str, **kwargs) -> str:
    """One-liner: classify and route a prompt, return just the text."""
    router = SmartRouter()
    result = router.complete(prompt, **kwargs)
    return result["content"]


# ── CLI test ──

if __name__ == "__main__":
    print("\n  Smart Router — Task Classification Demo")
    print("  " + "=" * 42 + "\n")

    test_prompts = [
        "What is 2+2?",
        "Translate 'hello' to Spanish",
        "Write a Python function that finds all prime numbers up to n using the Sieve of Eratosthenes",
        "Analyze the pros and cons of microservices vs monolithic architecture for a startup with 5 engineers, "
        "considering deployment complexity, team velocity, debugging overhead, and long-term scalability",
        "Extract the email addresses from this text: contact us at info@example.com or support@test.org",
        "```python\ndef broken():\n  return x + 1\n```\nFix this function, x is undefined",
        "Summarize this in one sentence: The quick brown fox jumps over the lazy dog.",
        "Write a comprehensive 1000-word blog post about the future of renewable energy",
    ]

    for prompt in test_prompts:
        tier = classify_task(prompt)
        short = prompt[:70] + "..." if len(prompt) > 70 else prompt
        print(f"  [{tier:<7}]  {short}")

    print("\n  Token budget caps per day:")
    for tier, info in TIERS.items():
        print(f"    {tier:<8} {info['token_cap_per_day']:>10,} tokens")
    print()
