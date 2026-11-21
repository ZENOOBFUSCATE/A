# CineBox Official Recap

ဤ project သည် video/audio ဖိုင်တင်ပြီး transcript၊ မြန်မာ recap စာသားနှင့် အသံထုတ်ပေးရန် Next.js + Vercel app ဖြစ်သည်။ CineBox logo နှင့်အရောင်ပုံစံကိုအသုံးပြုထားသည်။ Vercel တင်ရန် အသုံးပြုရမည့် project folder သည် `vercel-app` ဖြစ်သည်။

## GitHub သို့ upload လုပ်ရန်

1. ZIP ကို ကွန်ပျူတာထဲတွင် **Extract All** လုပ်ပါ။ ZIP ဖိုင်ကို GitHub သို့တိုက်ရိုက်တင်ခြင်း မလုပ်ပါနှင့်။
2. Extract လုပ်ထားသည့်ဖိုင်များကို GitHub repository ၏ root ထဲသို့ upload လုပ်ပါ။ `vercel-app` ဖိုဒါကို အတွင်းအဆင့်ထပ်မကျန်ဘဲ repository root မှာမြင်ရပါမည်။
3. GitHub ၏ **Add file → Upload files** ကိုနှိပ်၍ ဖိုင်များတင်ပြီး **Commit changes** ကိုနှိပ်ပါ။

## Vercel deploy လုပ်ရန်

1. Vercel Project → **Settings → General → Root Directory** ထဲတွင် `vercel-app` သတ်မှတ်ပါ။
2. Project ၏ **Storage** မှ Private Blob store ဖန်တီးပြီး project နှင့်ချိတ်ပါ။
3. **Settings → Environment Variables** ထဲတွင် အောက်ပါ variable များထည့်ပါ။
   - `GEMINI_MODEL` (optional; default `gemini-3.8-flash`)
   - `GEMINI_KEYS_ENCRYPTION_SECRET` (လိုအပ်သည်; random လုပ်ထားသော စာလုံး ၃၂ လုံးနှင့်အထက်)
   - `ELEVENLABS_API_KEY`
4. Website ကိုဖွင့်သူသည် Gemini API key ၁ ခုမှ ၅ ခုအထိ dialog ထဲတွင် တစ်ကြောင်းစီထည့်ရပါမည်။ Key များကို GitHub ထဲမတင်ပါနှင့်။
5. **Deployments → Redeploy** ကိုနှိပ်ပါ။ GitHub မှာ commit အသစ်တင်သည့်အခါ Vercel က အလိုအလျောက်ပြန် deploy လုပ်ပါမည်။

Vercel တွင် အရင်က သတ်မှတ်ထားသော `RECAP_ACCESS_CODE` နှင့် `GEMINI_API_KEY_1` မှ `_5` အထိ variable များကို ဖျက်နိုင်သည်; ယခု website က Gemini key များကို dialog မှရယူသည်။

## အသုံးပြုရန်လိုအပ်သည်များ

- ElevenLabs API key ကို server Environment Variables တွင် ထည့်ရမည်။ Gemini key များကို website တွင်လာသုံးသူက ထည့်သည်။ Gemini key ၅ ခုအထိ ထည့်နိုင်သည်; key တစ်ခု error/rate limit ဖြစ်လျှင် နောက် key ကို စမ်းသည်။ Key များက Gemini project တစ်ခုတည်းမှဖြစ်လျှင် project quota မတိုးပါ။
- Access Code စနစ်မရှိတော့ပါ။ Website သို့ဝင်လာသူတိုင်း အသုံးပြုနိုင်သဖြင့် ElevenLabs API အသုံးပြုခနှင့် Blob storage အသုံးပြုခ တက်နိုင်သည်။
- Private Vercel Blob store တစ်ခုကို Project နှင့် ချိတ်ဆက်ထားရပါမည်။
- Hobby plan တွင် function တစ်ခုကို ၅ မိနစ်အထိသာ လုပ်ဆောင်နိုင်သည်။ ၃၀ မိနစ် video များအတွက် Vercel plan/runtime ကန့်သတ်ချက်ကို စစ်ဆေးပါ။
- မူရင်း speaker ၏အသံကို clone လုပ်ရန် ထိုသူ၏ ခွင့်ပြုချက်လိုအပ်သည်။

အသေးစိတ်ကို `vercel-app/README.md` တွင် ဖတ်နိုင်သည်။
