import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recap MM — မြန်မာ AI Video Recap",
  description: "30 မိနစ်အထိ ဗီဒီယိုများကို မြန်မာလို အနှစ်ချုပ်ပြီး အသံဖိုင်ထုတ်ပေးပါသည်။",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="my"><body>{children}</body></html>;
}
