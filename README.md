# Recap MM — Video Recap ကို မြန်မာအသံဖြင့်

ဤ project သည် video/audio ဖိုင်တင်ပြီး transcript၊ မြန်မာ recap စာသားနှင့် အသံထုတ်ပေးရန် Next.js + Vercel app ဖြစ်သည်။ Vercel တင်ရန် အသုံးပြုရမည့် project folder သည် `vercel-app` ဖြစ်သည်။

## GitHub သို့ upload လုပ်ရန်

1. ZIP ကို ကွန်ပျူတာထဲတွင် **Extract All** လုပ်ပါ။ ZIP ဖိုင်ကို GitHub သို့တိုက်ရိုက်တင်ခြင်း မလုပ်ပါနှင့်။
2. Extract လုပ်ထားသည့်ဖိုင်များကို GitHub repository ၏ root ထဲသို့ upload လုပ်ပါ။ `vercel-app` ဖိုဒါကို အတွင်းအဆင့်ထပ်မကျန်ဘဲ repository root မှာမြင်ရပါမည်။
3. GitHub ၏ **Add file → Upload files** ကိုနှိပ်၍ ဖိုင်များတင်ပြီး **Commit changes** ကိုနှိပ်ပါ။

## Vercel deploy လုပ်ရန်

1. Vercel Project → **Settings → General → Root Directory** ထဲတွင် `vercel-app` သတ်မှတ်ပါ။
2. Project ၏ **Storage** မှ Private Blob store ဖန်တီးပြီး project နှင့်ချိတ်ပါ။
3. **Settings → Environment Variables** ထဲတွင် အောက်ပါ variable များထည့်ပါ။
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `RECAP_ACCESS_CODE` — ကိုယ်တိုင်သတ်မှတ်မည့် private access code
4. လိုအပ်လျှင် `vercel-app/.env.example` ထဲက optional variable များကိုလည်း ထည့်နိုင်သည်။ API key များကို GitHub ထဲ မတင်ပါနှင့်။
5. **Deployments → Redeploy** ကိုနှိပ်ပါ။ GitHub မှာ commit အသစ်တင်သည့်အခါ Vercel က အလိုအလျောက်ပြန် deploy လုပ်ပါမည်။

## အသုံးပြုရန်လိုအပ်သည်များ

- OpenAI API key နှင့် ElevenLabs API key ရှိရပါမည်။ သက်ဆိုင်ရာဝန်ဆောင်မှုများက အသုံးပြုခအလိုက် ကောက်ခံနိုင်သည်။
- Private Vercel Blob store တစ်ခုကို Project နှင့် ချိတ်ဆက်ထားရပါမည်။
- Hobby plan нь function-ыг ၅ မိနစ်အထိသာ လုပ်ဆောင်ပေးသည်။ ၃၀ မိနစ် video များအတွက် Vercel plan/runtime ကန့်သတ်ချက်ကို စစ်ဆေးပါ။
- မူရင်း speaker ၏အသံကို clone လုပ်ရန် ထိုသူ၏ ခွင့်ပြုချက်လိုအပ်သည်။

အသေးစိတ်ကို `vercel-app/README.md` တွင် ဖတ်နိုင်သည်။
