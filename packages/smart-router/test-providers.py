"""
Test Harness �� Verify All Free Tier Providers + Smart Routing
Run: python test-providers.py
     python test-providers.py --routing   (also test smart classification)
Requires: pip install openai python-dotenv requests
"""

import os
import sys
import time
import json
import requests
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv()

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"

TEST_PROMPT = "Say 'hello' in one word. Nothing else."

results = []


def test_provider(name, func):
    """Run a provider test and record the result."""
    print(f"\n  Testing {name}...", end=" ", flush=True)
    start = time.time()
    try:
        response = func()
        elapsed = time.time() - start
        print(f"{GREEN}OK{RESET} ({elapsed:.1f}s) — {response[:60]}")
        results.append({"provider": name, "status": "OK", "time": f"{elapsed:.1f}s", "response": response[:60]})
    except Exception as e:
        elapsed = time.time() - start
        error_msg = str(e)[:80]
        print(f"{RED}FAIL{RESET} ({elapsed:.1f}s) — {error_msg}")
        results.append({"provider": name, "status": "FAIL", "time": f"{elapsed:.1f}s", "error": error_msg})


def openai_compatible_test(base_url, api_key, model):
    """Generic test for OpenAI-compatible APIs."""
    from openai import OpenAI
    client = OpenAI(base_url=base_url, api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": TEST_PROMPT}],
        max_tokens=20,
    )
    return resp.choices[0].message.content.strip()


# ─�� Provider Tests ──

def test_groq():
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise ValueError("GROQ_API_KEY not set in .env")
    return openai_compatible_test(
        "https://api.groq.com/openai/v1", key, "llama-3.3-70b-versatile"
    )


def test_gemini():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY not set in .env")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
    resp = requests.post(url, json={
        "contents": [{"parts": [{"text": TEST_PROMPT}]}],
        "generationConfig": {"maxOutputTokens": 20}
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


def test_openrouter():
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        raise ValueError("OPENROUTER_API_KEY not set in .env")
    return openai_compatible_test(
        "https://openrouter.ai/api/v1", key, "meta-llama/llama-3.3-70b-instruct:free"
    )


def test_huggingface():
    key = os.getenv("HUGGINGFACE_API_KEY")
    if not key:
        raise ValueError("HUGGINGFACE_API_KEY not set in .env")
    from openai import OpenAI
    client = OpenAI(base_url="https://api-inference.huggingface.co/v1", api_key=key)
    resp = client.chat.completions.create(
        model="mistralai/Mistral-7B-Instruct-v0.3",
        messages=[{"role": "user", "content": TEST_PROMPT}],
        max_tokens=20,
    )
    return resp.choices[0].message.content.strip()


def test_mistral():
    key = os.getenv("MISTRAL_API_KEY")
    if not key:
        raise ValueError("MISTRAL_API_KEY not set in .env")
    return openai_compatible_test(
        "https://api.mistral.ai/v1", key, "mistral-small-latest"
    )


def test_ollama():
    base = os.getenv("OLLAMA_API_BASE", "http://localhost:11434")
    resp = requests.post(f"{base}/api/generate", json={
        "model": "llama3.1:8b",
        "prompt": TEST_PROMPT,
        "stream": False,
        "options": {"num_predict": 20}
    }, timeout=30)
    resp.raise_for_status()
    return resp.json()["response"].strip()


def test_smart_routing():
    """Test the smart router's task classification logic."""
    from smart_router import classify_task, TIERS

    print(f"\n{BOLD}{'='*50}")
    print("  Smart Router — Classification Test")
    print(f"{'='*50}{RESET}\n")

    test_cases = [
        # (prompt, expected_tier)
        ("What is 2+2?", "simple"),
        ("Translate 'hello' to French", "simple"),
        ("Extract emails from: contact@test.com", "simple"),
        ("Summarize this: The quick brown fox", "simple"),
        ("Explain how TCP/IP handshake works with packet flow details", "medium"),
        ("Compare React vs Vue for a mid-size team building dashboards", "medium"),
        ("Write a Python function to find primes using Sieve of Eratosthenes", "code"),
        ("```js\nconst x = undefined\nx.map()\n```\nFix this bug", "code"),
        ("Debug this traceback: TypeError at line 42", "code"),
        ("Write a comprehensive 1000-word essay on renewable energy policy", "complex"),
        ("Analyze pros and cons of microservices vs monolith for a 5-person startup considering deployment, velocity, and scalability", "complex"),
        ("Create a detailed business plan outline for an AI consultancy", "complex"),
    ]

    passed = 0
    failed = 0

    for prompt, expected in test_cases:
        actual = classify_task(prompt)
        short = prompt[:55] + "..." if len(prompt) > 55 else prompt
        if actual == expected:
            print(f"  {GREEN}✓{RESET} [{actual:<7}] {short}")
            passed += 1
        else:
            print(f"  {RED}✗{RESET} [{actual:<7}] expected [{expected}] — {short}")
            failed += 1

    print(f"\n  {GREEN}{passed} passed{RESET}, {RED}{failed} failed{RESET} out of {len(test_cases)} classifications")

    # Show token budgets
    print(f"\n  Daily token caps (self-imposed to conserve free tiers):")
    for tier, info in TIERS.items():
        print(f"    {tier:<8} {info['token_cap_per_day']:>10,} tokens  |  max {info['max_tokens']:,} per request")

    return failed == 0


# ── Run All Tests ──

if __name__ == "__main__":
    print(f"\n{BOLD}{'='*50}")
    print("  Free Inference Stack — Provider Test")
    print(f"{'='*50}{RESET}")

    providers = [
        ("Groq", test_groq),
        ("Google Gemini", test_gemini),
        ("OpenRouter", test_openrouter),
        ("Hugging Face", test_huggingface),
        ("Mistral", test_mistral),
        ("Ollama (local)", test_ollama),
    ]

    for name, func in providers:
        test_provider(name, func)

    # ─��� Provider Summary ──
    print(f"\n{BOLD}{'='*50}")
    print("  Provider Results")
    print(f"{'='*50}{RESET}\n")

    ok_count = sum(1 for r in results if r["status"] == "OK")
    fail_count = sum(1 for r in results if r["status"] == "FAIL")

    for r in results:
        icon = f"{GREEN}���{RESET}" if r["status"] == "OK" else f"{RED}✗{RESET}"
        print(f"  {icon} {r['provider']:<20} {r['time']:>6}")

    print(f"\n  {GREEN}{ok_count} passed{RESET}, {RED}{fail_count} failed{RESET} out of {len(results)} providers")

    if fail_count > 0:
        print(f"\n{YELLOW}  Tip: Failed providers may just need API keys in .env{RESET}")
        print(f"  See FREE-TIER-CHECKLIST.md for sign-up links")

    # ── Smart Routing Test ���─
    if "--routing" in sys.argv or "--all" in sys.argv:
        test_smart_routing()
    else:
        print(f"\n  {CYAN}Run with --routing to also test smart task classification{RESET}")

    # ── Cost Summary ─���
    print(f"\n{BOLD}{'='*50}")
    print("  Routing Strategy")
    print(f"{'='*50}{RESET}\n")
    print("  Request model name:  What it does:")
    print("  ─────────────────    ────────────────────────────────────────")
    print(f"  {CYAN}simple{RESET}               → 8B models first (Groq/Ollama) — cheapest")
    print(f"  {CYAN}medium{RESET}               → 70B free tiers (Groq/Gemini/OpenRouter)")
    print(f"  {CYAN}complex{RESET}              → Best free models, all options exhausted")
    print(f"  {CYAN}code{RESET}                 → Codestral first, then 70B fallbacks")
    print(f"  {YELLOW}paid-fallback{RESET}        → BLOCKED by $0 budget (uncomment to enable)")
    print()
    print("  Token efficiency rules:")
    print("  • Simple tasks capped at 256 tokens — no waste on short answers")
    print("  • Medium tasks capped at 1,024 tokens")
    print("  • Complex tasks capped at 4,096 tokens")
    print("  • Daily per-tier budgets prevent runaway usage")
    print("  • Over-budget tiers auto-downgrade to cheaper tier")
    print("  • $0 max_budget in LiteLLM blocks ALL paid API calls")
    print()
