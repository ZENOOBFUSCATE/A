# CineBox Official Recap — Vercel app

Next.js deployment for GitHub + Vercel. Vercel Blob stores source video and authorized voice samples privately using signed upload URLs. Vercel Workflows runs transcription, Burmese recap generation, TTS, and cleanup as durable steps.

## Deploy

1. Push the `outputs` folder contents to a GitHub repository.
2. Import that repo into Vercel and set the project **Root Directory** to `vercel-app`.
3. Add a **Private Vercel Blob** store to the project.
4. Add `ELEVENLABS_API_KEY` and `GEMINI_KEYS_ENCRYPTION_SECRET` to Vercel Project Settings. The encryption secret must be a stable random string of at least 32 characters. Gemini API keys are entered by each user in the website dialog and are encrypted before they are passed into durable Workflow state. Never put secrets in GitHub.
5. Enable Fluid Compute. Pro/Enterprise's extended 30-minute function duration is required for the full 30-minute transcription step; Hobby is limited to five minutes per function step.
6. Redeploy after setting secrets and connecting Blob.

There is no Access Code gate: any visitor can use the site. The site owner pays for ElevenLabs and Blob usage, so a public deployment can incur charges. Add rate limits/account controls if usage must be restricted.

Users can enter up to five Gemini API keys in the website dialog, one key per line. The next key is tried when the current key fails or hits a limit. Keys from the same Google AI Studio project share the project's quota; extra keys do not increase it. Gemini uses Google's Interactions API and defaults to `gemini-3.8-flash`.

## Local development

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Local runs need Vercel Blob credentials to use private uploads. Workflow execution in local mode is for development only; production runs use Vercel's managed Workflow backend.

## Notes

- Source video and sample uploads are private. The workflow gives ElevenLabs a short-lived signed read URL for transcription and voice cloning, then deletes source blobs after processing.
- Recap audio is stored as a private Blob with a 24-hour signed download URL.
- AI provider usage may incur separate charges.
- Instant voice cloning needs the speaker's permission and a clean audio sample. Cloned output can resemble the source voice, but cannot be guaranteed identical.
