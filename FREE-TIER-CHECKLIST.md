# Free Tier Sign-Up Checklist

Complete each sign-up (~10 minutes total), then paste the API key into your `.env` file.

---

## 1. OpenRouter
- **Sign up:** https://openrouter.ai/keys
- **Free quota:** $0 credit on free models (Llama, Mistral, Gemma, etc.)
- **Free models:** Llama 3.3 70B, Mistral 7B, Gemma 2 9B, Phi-3, and 30+ others marked "$0"
- **Key format:** `sk-or-v1-...`
- **Notes:** Acts as a router itself — can also aggregate other providers. No credit card required.
- [ ] Signed up
- [ ] Key added to `.env`

---

## 2. Groq
- **Sign up:** https://console.groq.com/keys
- **Free quota:** 14,400 requests/day on Llama models, 14,400 on Mixtral
- **Free models:** Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma 2 9B
- **Key format:** `gsk_...`
- **Speed:** Fastest inference available — great for high-volume, low-latency tasks
- **Notes:** No credit card required. Rate limits reset daily.
- [ ] Signed up
- [ ] Key added to `.env`

---

## 3. Google AI Studio (Gemini)
- **Sign up:** https://aistudio.google.com/apikey
- **Free quota:** 15 RPM on Gemini 2.0 Flash, 1,500 requests/day
- **Free models:** Gemini 2.0 Flash, Gemini 2.0 Flash-Lite, Gemini 1.5 Flash
- **Key format:** `AIza...`
- **Notes:** No credit card required. Free tier is generous for supplemental use.
- [ ] Signed up
- [ ] Key added to `.env`

---

## 4. Mistral (La Plateforme)
- **Sign up:** https://console.mistral.ai/api-keys
- **Free quota:** Free tier with rate limits (experimental endpoints)
- **Free models:** Mistral Small, Mistral Nemo, Codestral (via codestral.mistral.ai)
- **Key format:** Starts with alphanumeric string
- **Notes:** Free tier may require credit card on file but won't charge. Check current terms.
- [ ] Signed up
- [ ] Key added to `.env`

---

## 5. Hugging Face Inference API
- **Sign up:** https://huggingface.co/settings/tokens
- **Free quota:** Rate-limited inference on thousands of models
- **Free models:** Llama, Mistral, Falcon, StarCoder, Phi, and thousands more
- **Key format:** `hf_...`
- **Notes:** No credit card required. Best for diverse model access. Slower than Groq.
- [ ] Signed up
- [ ] Key added to `.env`

---

## 6. Ollama (Local)
- **Install:** https://ollama.ai/download
- **Free quota:** Unlimited — runs on your hardware
- **Recommended models:**
  - `ollama pull llama3.1:8b` — fast general purpose (4.7GB)
  - `ollama pull codellama:13b` — code tasks (7.4GB)
  - `ollama pull mistral:7b` — balanced general purpose (4.1GB)
  - `ollama pull phi3:mini` — lightweight, fast (2.3GB)
- **Endpoint:** `http://localhost:11434`
- **Notes:** No account needed. GPU recommended but CPU works. Final fallback when cloud quotas run out.
- [ ] Installed
- [ ] At least one model pulled
- [ ] Ollama running (`ollama serve`)

---

## Priority Order (cost routing)
1. **Groq** — fastest, high daily limits
2. **Google AI Studio** — solid free tier, good models
3. **OpenRouter free models** — wide selection at $0
4. **Hugging Face** — huge model variety, slower
5. **Mistral** — experimental endpoints
6. **Ollama** — unlimited local backstop, never runs out
