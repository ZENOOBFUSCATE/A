"use client";
import { useRef, useState } from "react";

type JobState = { status?: string; result?: { ok: boolean; summary?: string; transcript?: string; audioUrl?: string; error?: string }; error?: string };

export default function Home() {
  const picker = useRef<HTMLInputElement>(null);
  const samplePicker = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState<File | null>(null);
  const [minutes, setMinutes] = useState(3);
  const [voiceMode, setVoiceMode] = useState("default");
  const [voiceId, setVoiceId] = useState("");
  const [consent, setConsent] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<JobState["result"]>(undefined);
  const [drag, setDrag] = useState(false);

  async function request(path: string, body: unknown) {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", "x-recap-access-code": accessCode }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request မအောင်မြင်ပါ။");
    return data;
  }

  async function directUpload(f: File, type: "video" | "sample", onProgress: (n: number) => void) {
    const signed = await request("/api/blob/sign", { kind: type, filename: f.name, contentType: f.type, size: f.size });
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signed.url);
      xhr.setRequestHeader("Content-Type", f.type || "application/octet-stream");
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Vercel Blob သို့ upload မအောင်မြင်ပါ။"));
      xhr.onerror = () => reject(new Error("Upload connection ပြတ်တောက်သွားပါသည်။"));
      xhr.send(f);
    });
    return signed.pathname as string;
  }

  async function start() {
    if (!file || busy) return;
    if (voiceMode === "clone" && (!sample || !consent)) { setError("အသံနမူနာထည့်ပြီး clone ခွင့်ပြုချက်ကို အတည်ပြုပါ။"); return; }
    if (!unlocked || !accessCode.trim()) { setError("ဆက်လုပ်ရန် access code ထည့်ပါ။"); return; }
    setBusy(true); setError(""); setResult(undefined); setPercent(0);
    try {
      setStatus("ဗီဒီယိုကို Vercel Blob သို့ လုံခြုံစွာ တင်နေသည်…");
      const videoPath = await directUpload(file, "video", setPercent);
      let samplePath: string | undefined;
      if (voiceMode === "clone" && sample) {
        setStatus("အသံနမူနာကို တင်နေသည်…"); setPercent(0);
        samplePath = await directUpload(sample, "sample", setPercent);
      }
      setStatus("AI မှ အသံကို စာသားပြောင်းပြီး မြန်မာ recap ရေးနေသည်…"); setPercent(3);
      const created = await request("/api/recap", { videoPath, samplePath, minutes, voiceId, clone: voiceMode === "clone", consent });
      let finished: JobState | undefined;
      for (let i = 0; i < 540; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        finished = await (await fetch(`/api/recap/${encodeURIComponent(created.runId)}`, { headers: { "x-recap-access-code": accessCode } })).json();
        if (finished?.status === "completed" || finished?.status === "failed" || finished?.status === "cancelled") break;
        setPercent(Math.min(92, 5 + Math.floor(i / 5)));
      }
      if (!finished || finished.status !== "completed") throw new Error(finished?.error || "အလုပ်ကြာချိန်ကျော်သွားသည်။ နောက်မှ ပြန်စစ်ပါ။");
      if (!finished.result?.ok) throw new Error(finished.result?.error || "Recap ဖန်တီးမရပါ။");
      setResult(finished.result); setStatus("Recap အသင့်ဖြစ်ပါပြီ။"); setPercent(100);
    } catch (e) { setError(e instanceof Error ? e.message : "မမျှော်လင့်ထားသော ပြဿနာဖြစ်သည်။"); }
    finally { setBusy(false); }
  }

  return <main className="shell">
    <header className="top"><div className="brand"><span className="mark">▶</span> recap<span style={{color:"#699b3e"}}>mm</span></div><span className="pill">30 မိနစ်အထိ · Vercel</span></header>
    <section className="hero"><div className="eyebrow">VIDEO → IDEAS → MYANMAR VOICE</div><h1 className="my">ဗီဒီယိုရှည်တွေကို<br/>မြန်မာလို အနှစ်ချုပ်နားထောင်ပါ</h1><p className="my">ဗီဒီယိုကို တင်ပါ။ အဓိကအကြောင်းအရာတွေကို မြန်မာလို recap လုပ်ပြီး နားထောင်နိုင်တဲ့ အသံဖိုင်အဖြစ် ထုတ်ပေးပါမယ်။</p><div className="tags"><span className="tag">🌐 <b>ဘာသာစကားမျိုးစုံ</b></span><span className="tag">⏱️ <b>30 မိနစ်အထိ</b></span><span className="tag">🎙️ <b>မြန်မာ narration</b></span><span className="tag">🔐 <b>Private upload</b></span></div></section>
    <section className="layout"><div className="card">
      <div className="head"><span className="step">01</span><div><h2 className="my">ဗီဒီယိုနဲ့ အသံရွေးပါ</h2><div className="sub">MP4, MOV, MKV, WebM · 30 မိနစ်အထိ</div></div></div>
      <div className={`drop ${drag?"over":""}`} onClick={()=>picker.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)setFile(f)}}><div className="dropicon">📁</div><strong className="my">ဗီဒီယိုကို ဆွဲထည့်ပါ၊ သို့မဟုတ် ရွေးချယ်ပါ</strong><span>ကြီးမားသောဖိုင်များကို Vercel Blob သို့ တိုက်ရိုက် upload လုပ်သည်</span><input ref={picker} hidden type="file" accept="video/*,audio/*" onChange={e=>setFile(e.target.files?.[0]||null)}/></div>
      {file&&<div className="fileinfo"><span>{file.name}</span><span>{(file.size/1024/1024).toFixed(1)} MB</span></div>}
      <div className="field"><div className="label"><span className="my">Recap ကြာချိန်</span><span className="hint">အလိုအလျောက်အရှည်ညှိပေးသည်</span></div><div className="range"><input type="range" min="1" max="10" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/><span className="rangeval">{minutes} မိနစ်</span></div></div>
      <div className="field"><div className="label"><span className="my">အသံရွေးချယ်မှု</span><span className="hint">ElevenLabs voice</span></div><div className="voicebox"><div className="radios"><label className="radio"><input type="radio" checked={voiceMode==="default"} onChange={()=>setVoiceMode("default")}/> ရှိပြီးသား voice</label><label className="radio"><input type="radio" checked={voiceMode==="clone"} onChange={()=>setVoiceMode("clone")}/> စပီကာအသံ clone</label></div>{voiceMode==="default"?<input style={{marginTop:10}} type="text" placeholder="Voice ID (သို့) server default" value={voiceId} onChange={e=>setVoiceId(e.target.value)}/>:<><div className="hint my" style={{marginTop:12,marginBottom:6}}>သန့်ရှင်းသော အသံနမူနာ (10 စက္ကန့်နှင့်အထက်)</div><input ref={samplePicker} type="file" accept="audio/*" onChange={e=>setSample(e.target.files?.[0]||null)}/>{sample&&<div className="hint" style={{marginTop:5}}>{sample.name} · {(sample.size/1024/1024).toFixed(1)} MB</div>}<label className="check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span className="my">ဤအသံကို clone လုပ်ရန် ပိုင်ဆိုင်ခွင့် သို့မဟုတ် အသံပိုင်ရှင်၏ ခွင့်ပြုချက်ရှိပါသည်။</span></label><div className="note my">Clone အသံသည် မူရင်းစပီကာနှင့် ဆင်တူအောင် ကြိုးစားသော်လည်း အတိအကျတူညီမည်ဟု အာမခံမရပါ။</div></>}</div></div>
      <div className="field"><div className="label"><span className="my">အသုံးပြုခွင့်</span><span className="hint">site admin မှပေးထားသော code</span></div>{unlocked?<div className="hint">✓ Access code ထည့်ပြီးပါပြီ</div>:<div className="gate"><input type="password" placeholder="Access code" value={accessCode} onChange={e=>setAccessCode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")setUnlocked(!!accessCode.trim())}}/><button onClick={()=>{setUnlocked(!!accessCode.trim());setError("")}}>အတည်ပြု</button></div>}</div>
      <button className="button my" disabled={!file||busy||!unlocked} onClick={start}>{busy?"လုပ်ဆောင်နေသည်…":"✨ မြန်မာ Recap ဖန်တီးမည်"}</button>
      <div className="tiny my">ဗီဒီယို၊ transcript နှင့် recap များကို AI ဝန်ဆောင်မှုများသို့ ပေးပို့သည်။ ပြီးဆုံးလျှင် မူရင်း upload ဖိုင်များကိုဖျက်သည်။</div>
      {(busy||status||error)&&<div className={`status show ${error?"error":""}`}>{error||status}<div className="barbg"><div className="bar" style={{width:`${percent}%`}}/></div></div>}
    </div><div className="card"><div className="head"><span className="step">02</span><div><h2 className="my">သင့် Recap</h2><div className="sub">မြန်မာစာသားနှင့် နားထောင်နိုင်သောအသံ</div></div></div>
      {!result?<div className="empty"><div><div className="emptyicon">🎧</div><strong className="my">သင့် Recap ဒီမှာပေါ်လာမယ်</strong><span className="my">ဗီဒီယိုကိုတင်ပြီး စတင်ပါ။ Transcript နဲ့ summary ကို အသံမသိမ်းခင် စစ်ဆေးနိုင်ပါတယ်။</span></div></div>:<div className="resbody show"><div className="resulttop"><span className="done">✓ ပြီးပါပြီ</span><a className="download" href={result.audioUrl} download>↓ အသံဖိုင်သိမ်းရန်</a></div><audio className="player" controls src={result.audioUrl}/><h3 className="my">အနှစ်ချုပ်</h3><div className="summary my">{result.summary}</div><h3 className="my">Transcript</h3><div className="transcript">{result.transcript}</div></div>}
    </div></section>
    <footer className="foot"><div className="footrow"><div className="privacy my">အသံ cloning ကို မူရင်းအသံပိုင်ရှင်၏ ခွင့်ပြုချက်ဖြင့်သာ အသုံးပြုပါ။ Voice cloning အတွက် ကိုယ်ပိုင်အသံနမူနာကို server ပေါ်တင်ရပါမည်။ API provider များတွင် သက်ဆိုင်ရာ usage charges ရှိနိုင်သည်။</div><span>Recap MM · GitHub + Vercel</span></div></footer>
  </main>;
}
