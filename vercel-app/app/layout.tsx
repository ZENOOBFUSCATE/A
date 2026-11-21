import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineBox Official Recap — မြန်မာ AI Video Recap",
  description: "CineBox Official Recap ဖြင့် ဗီဒီယိုများကို မြန်မာလို အနှစ်ချုပ်နားထောင်ပါ။",
  icons: { icon: "/cinebox-logo.jpg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="my"><body>{children}</body></html>;
}
