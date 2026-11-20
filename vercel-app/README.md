# Recap MM — Vercel app

Next.js deployment for GitHub + Vercel. Vercel Blob stores source video and authorized voice samples privately using signed upload URLs. Vercel Workflows runs transcription, Burmese recap generation, TTS, and cleanup as durable steps.

## Deploy

1. Push the `outputs` folder contents to a GitHub repository.
2. Import that repo into Vercel and set the project **Root Directory** to `vercel-app`.
3. Add a **Private Vercel Blob** store to the project.
4. Add the variables in `.env.example` to Vercel Project Settings. `RECAP_ACCESS_CODE`, `OPENAI_API_KEY`, and `ELEVENLABS_API_KEY` are required. Never put secrets in GitHub.
5. Enable Fluid Compute. Pro/Enterprise's extended 30-minute function duration is required for the full 30-minute transcription step; Hobby is limited to five minutes per function step.
6. Redeploy after setting secrets and connecting Blob.

The access code is a shared gate, suitable for a private demo. A public service should add user accounts and per-user rate/cost limits before opening it widely.

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
