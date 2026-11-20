# Recap MM

မြန်မာဘာသာနဲ့ video recap ဖန်တီးရန် frontend နှင့် Python API worker။ 30 မိနစ်အထိ audio/video ဖိုင်ကို transcribe လုပ်ပြီး မြန်မာ recap script နှင့် MP3 အသံထုတ်ပေးသည်။

## GitHub + Vercel

GitHub repository မှ Vercel import လုပ်ပြီး **Root Directory** ကို `vercel-app` သတ်မှတ်ပါ။ `vercel-app` သည် Next.js UI, signed private Blob uploads, API routes, durable Workflow processing အားလုံးပါဝင်သည့် Vercel-only deployment ဖြစ်သည်။ Vercel dashboard တွင် private Blob store တစ်ခုဖန်တီးပြီး project နှင့်ချိတ်ပါ။

Vercel Project Environment Variables တွင် `.env.example` ထဲက `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `RECAP_ACCESS_CODE` တို့ကိုသတ်မှတ်ပါ။ `RECAP_ACCESS_CODE` ကို လုံခြုံသော shared code တစ်ခုထားပြီး အသုံးပြုသူများနှင့် သီးသန့်မျှဝေပါ။ Optional `ELEVENLABS_VOICE_ID`, `OPENAI_MODEL`, `ELEVENLABS_STT_MODEL`, `ELEVENLABS_TTS_MODEL` လည်းရှိသည်။ Secret များကို GitHub ထဲ မထည့်ပါနှင့်။

**30 မိနစ် input ကန့်သတ်ချက်:** ဖိုင်ကြီးများကို 4.5 MB Function request မှတစ်ဆင့်မတင်ဘဲ Vercel Blob signed URL သို့ browser က တိုက်ရိုက်တင်သည်။ Workflow က processing အဆင့်များကို durable လုပ်ပေးသည်။ Transcription step အတွက် Vercel Pro/Enterprise ၏ extended 30-minute Function duration beta လိုအပ်နိုင်သည်; Hobby မှာ step တစ်ခုလျှင် 5 မိနစ်အထိသာဖြစ်သည်။ 30-minute video အားလုံးကို Hobby plan မှာ မအာမခံနိုင်ပါ။ [30-minute Function update](https://vercel.com/changelog/vercel-functions-can-now-run-up-to-30-minutes), [Blob signed URLs](https://vercel.com/changelog/signed-urls-are-now-available-for-vercel-blob), [Workflow SDK](https://workflow-sdk.dev/worlds/vercel)

## Local Python version

1. Python 3.10+ နှင့် FFmpeg (ffmpeg, ffprobe) ကို install လုပ်ပါ။
2. Terminal ကို `outputs/backend` folder မှာဖွင့်ပါ။
3. Virtual environment တည်ဆောက်ပြီး dependencies ထည့်သွင်းပါ:

   ```powershell
   py -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   Copy-Item .env.example .env
   ```

4. `.env` ထဲမှာ `OPENAI_API_KEY` နှင့် `ELEVENLABS_API_KEY` ထည့်ပါ။ Voice ကို clone မလုပ်ဘဲသုံးမယ်ဆို `ELEVENLABS_VOICE_ID` ထည့်နိုင်သည်။
5. Run လုပ်ပါ: `python app.py` ပြီးနောက် browser မှ `http://127.0.0.1:5000` ကိုဖွင့်ပါ။

API key များကို browser ထဲမသိမ်းဘဲ server ပေါ်တွင်သာထားသည်။ Provider account usage/charges များ သက်ဆိုင်ရာ provider ထံမှ ကောက်ခံနိုင်သည်။ Internet access လိုအပ်သည်။

## Voice

ရှိပြီးသား voice ကိုသုံးရန် ElevenLabs Voice ID သို့မဟုတ် `.env` ထဲက default ID ကိုသုံးပါ။ မူရင်းအသံနှင့်တူအောင် clone လုပ်လိုပါက **အသံပိုင်ရှင်ဖြစ်ကြောင်း၊ သို့မဟုတ် clone လုပ်ရန် ခွင့်ပြုချက်ရထားကြောင်း** အတည်ပြုပြီး သန့်ရှင်းသောအသံနမူနာတင်ပါ။ ElevenLabs ၏ Instant Voice Clone API ကိုသုံးပြီး အသံအသစ်ကို account ထဲဖန်တီးသည်။ Clone အသံက မူရင်းအသံနှင့် အတိအကျတူညီမည်မဟုတ်ပါ။ ထို provider account ထဲမှာဖန်တီးထားသော voice clone ကို လိုအပ်လျှင် account မှဖယ်ရှားပါ။

## ဘယ်လိုအလုပ်လုပ်သလဲ

- `ffprobe` ဖြင့် ဖိုင်ကြာချိန်စစ်ဆေးပြီး 30 မိနစ်ထက်ကျော်လျှင် ငြင်းပယ်သည်။
- ElevenLabs Scribe မှ transcript နှင့် speaker labels ရယူသည်။
- OpenAI Responses API ဖြင့် အနှစ်ချုပ်ပြီး သဘာဝကျသော မြန်မာ narration script ရေးသည်။
- ElevenLabs TTS ဖြင့် MP3 ထုတ်ပြီး browser မှနားထောင်/သိမ်းနိုင်သည်။
- မူရင်း upload ကို temporary folder မှ request ပြီးချင်းဖျက်သည်။ ထုတ်ထားသော MP3 သည် server ပေါ်တွင် 24 နာရီအထိသာရှိသည်။

## လက်ရှိကန့်သတ်ချက်များ

- Transcript က recap အခြေခံဖြစ်သောကြောင့် အသံမရှင်းခြင်း၊ စကားများထပ်ပြောခြင်း၊ speaker diarization မှားခြင်းတို့ကြောင့် အနှစ်ချုပ်အမှားဖြစ်နိုင်သည်။ နားမထောင်မီ စာသားကိုစစ်ဆေးပါ။
- အသံအများကြီးပြောသူပါသော video အတွက် အသုံးပြုသူတင်သည့် အသံနမူနာတစ်ခုကို clone လုပ်ခြင်းသာ ထောက်ပံ့ထားသည်။ Speaker တစ်ဦးချင်းစီအလိုက် dialogue dubbing မလုပ်ပါ။
- Recap narration audio သာ output ဖြစ်ပြီး မူရင်း video ထဲကို အစားထိုးသွင်းပေးခြင်းမပါသေးပါ။
- Production သုံးရန် authentication, rate limiting, HTTPS, upload quotas, storage deletion job နှင့် provider cost limits ထပ်တိုးပါ။ `app.py` ကို public internet သို့ တိုက်ရိုက်မဖွင့်ပါနှင့်။

## Provider docs

- [ElevenLabs speech-to-text](https://elevenlabs.io/docs/api-reference/speech-to-text/convert)
- [ElevenLabs instant voice cloning](https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/instant-voice-cloning)
- [ElevenLabs text-to-speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert/)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
