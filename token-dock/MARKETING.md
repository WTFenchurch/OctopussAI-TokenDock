# Token Dock — Marketing Copy

Ready-to-post content for social media. Copy, paste, post.

---

## Reddit: r/LocalLLaMA

**Title:** I built a free desktop dock that tracks every token across Ollama, Groq, Gemini, OpenRouter, Mistral, and HuggingFace — with an animated octopus that eats your tokens

**Body:**

Hey r/LocalLLaMA — I've been running a multi-provider free inference stack (Ollama local + Groq + Gemini + OpenRouter + Mistral + HuggingFace) and got tired of not knowing which providers were online, how many tokens I'd burned, or how much I was actually saving vs. paid APIs.

So I built **Token Dock** — an always-on-top Electron desktop dock that shows everything at a glance:

- Live provider status (green/red dots for each service)
- Token usage per task tier (Simple/Medium/Complex/Code)
- Weighted savings calculator (uses real per-model pricing, not flat estimates)
- Daily reset countdowns per provider (Groq resets midnight UTC, Gemini midnight PT, etc.)
- Paid subscription tracker (Claude, ChatGPT, Copilot, etc.)
- 3-speed tier system: Economy (free only) → Standard (best free 70B) → Turbo (free first, paid fallback)

Oh, and there's an animated octopus named Otto who lives in an underwater world, chases and eats token coins, makes funny faces at you, and gets visited by sea creature friends. Because why not.

**18 themes**, stale data warnings, model tags on every budget tier with hover tooltips explaining what each model handles.

100% open source. Free. No telemetry.

- Download: https://github.com/WTFenchurch/OctopussAI-TokenDock/releases
- Source: https://github.com/WTFenchurch/OctopussAI-TokenDock
- Homepage: https://wtfenchurch.github.io/octopuss-ai/

Built with Electron + vanilla JS + anime.js. Single HTML file, zero framework dependencies.

Would love feedback from anyone running multi-provider stacks!

---

## Reddit: r/ClaudeAI

**Title:** Built an open-source token monitor that tracks Claude Max usage alongside free providers — helps me know exactly when I'm burning paid tokens

**Body:**

If you're on Claude Max ($100/mo) and also use free providers (Groq, Gemini, Ollama), it's hard to know where your tokens are going.

I built **Token Dock** — a desktop dock that sits on top of your screen and shows:

- Your Claude Max usage with pace tracking (are you burning faster than your daily budget allows?)
- All free provider quotas with reset countdowns
- A "Free Savings" calculator showing how much money free routing saved you today
- Stale data warnings so you never look at outdated numbers
- Native OS alerts when paid tokens are used

It also has a cute animated octopus named Otto who eats token coins in an underwater world. 18 themes including a Claude Code theme.

Open source, free, no data collection: https://github.com/WTFenchurch/OctopussAI-TokenDock

---

## Reddit: r/artificial

**Title:** We named our AI company after the octopus — here's why they're the perfect model for ethical AI

**Body:**

Our company is called Octopus AI, and every design decision maps to actual octopus biology:

🧠 **Nine brains** — one central, one in each arm. Each arm thinks independently but they coordinate as one. Our AI teams work the same way.

💙 **Three hearts** — we believe AI needs multiple hearts too: compassion for users, respect for privacy, and love for the craft.

🧬 **Blue blood** — copper-based, more efficient in extreme environments. We route through free tiers first, maximizing output in resource-constrained stacks.

🔧 **Tool users** — octopuses carry coconut shells as armor. We build with what's freely available before reaching for anything expensive.

🤝 **Gentle giants** — despite being powerful predators, they investigate humans with soft touches. Powerful AI, gentle application.

🥚 **Devoted parents** — a mother octopus guards her eggs for months without eating. We build OttoJr (our open-source LLM) with the same devotion to the next generation.

Our first product is Token Dock — a free desktop monitor for AI token usage. Our ethics aren't a system prompt. They're in the weights.

Six immutable principles: Do No Harm. Protect Humans. Be Transparent. Be Fair. Be Compassionate. Respect Autonomy.

https://wtfenchurch.github.io/octopuss-ai/

---

## Reddit: r/ElectronJS

**Title:** Single-file Electron app: 4,500 lines of vanilla JS, SVG character animation, CSS @keyframes, anime.js springs — no React, no framework

**Body:**

Built Token Dock as a single `index.html` with everything inline — CSS, HTML, JS. Zero framework dependencies. Here's what's in it:

**Animation system:**
- SVG octopus character with CSS @keyframes for idle (bob, blink, tentacle wave)
- anime.js v3 for spring physics (squash/stretch on eat, bounce, recoil)
- State machine: idle → spotted → swimming → gulping → satisfied
- 12 personality actions (wink, tongue, hearts, curl/unfurl)
- Sea creatures swim through every 7 seconds
- 3D CSS coins with Y-axis rotation and edge thickness
- `prefers-reduced-motion` support

**Desktop features:**
- Always-on-top transparent window
- System tray with right-click context menu
- Auto-hide timer
- Minimize to floating bubble
- Single-instance lock
- electron-store for persistence

**Provider monitoring:**
- Health checks against 6 free AI providers
- Rate limit header parsing
- Timezone-aware reset countdowns
- Weighted savings using per-model pricing

No bundler. No webpack. No build step. Just `npm start`.

https://github.com/WTFenchurch/OctopussAI-TokenDock

---

## X.com / Twitter

**Post 1 (Launch):**
```
🐙 Introducing Token Dock — your AI token command center.

Track every free token. Every paid dollar. Every provider.

✅ Ollama, Groq, Gemini, OpenRouter, Mistral, HuggingFace
✅ Weighted savings calculator
✅ 18 themes
✅ Animated octopus companion

Free. Open source. No telemetry.

Nine Brains. One Mission.

https://github.com/WTFenchurch/OctopussAI-TokenDock
```

**Post 2 (Why Octopus):**
```
Why did we name our AI company after an octopus?

🧠 9 brains — distributed intelligence
💙 3 hearts — compassion built in
🧬 Blue blood — efficiency in extreme environments
🔧 Tool users — resourceful by nature
🤝 Gentle giants — powerful but kind

Intelligence without heart is hollow.

https://wtfenchurch.github.io/octopuss-ai/
```

**Post 3 (Otto):**
```
Meet Otto — the AI octopus who lives inside Token Dock.

He chases token coins, makes funny faces, blows bubbles, winks at you, and sends hearts when he's happy.

The more compute you use, the more alive he becomes.

🐙 Nine Brains. One Mission.

https://github.com/WTFenchurch/OctopussAI-TokenDock/releases
```

---

## LinkedIn

**Title:** We built an open-source AI token monitor — and learned something about compassionate engineering

**Body:**

At Octopus AI, our first product is Token Dock — a free desktop tool that monitors AI token usage across every major free and paid provider.

But the real story isn't the product. It's the principles.

Every decision passes through six immutable rules: Do No Harm. Protect Humans. Be Transparent. Be Fair. Be Compassionate. Respect Autonomy.

We chose the octopus as our mascot because they embody everything we want AI to be — adaptable, intelligent, resourceful, and gentle despite their power.

Token Dock is free. Open source. No telemetry. No data collection. Just a useful tool built with love.

Because intelligence without heart is hollow.

🐙 https://wtfenchurch.github.io/octopuss-ai/

---

## How to Post

1. **Copy the text** for the platform you want
2. **Log into your account** on that platform
3. **Paste and post**
4. For Reddit: post as text, not link
5. For X: use Post 1 first, then 2 and 3 as replies in a thread
6. For LinkedIn: post as an article or status update

## Suggested Posting Order
1. r/LocalLLaMA (our core audience — multi-provider stack users)
2. r/artificial (ethics angle — community focused)
3. X.com thread (3 posts)
4. r/ElectronJS (technical angle — dev community)
5. LinkedIn (professional angle)
6. r/ClaudeAI (only if tone stays friendly/community, not competitive)

## DO NOT POST TO
- r/OpenAI — don't provoke big tech
- r/ChatGPT — same reason
- Any subreddit where the post could be seen as attacking a specific company
- Keep it positive, community-focused, indie project energy
