import type { Metadata } from "next";
import LandingPage from "./_components/LandingPage";

export const metadata: Metadata = {
  title: "HalQil — Mahalliy Xizmat Marketplace | AI bilan usta toping",
  description:
    "O'zbekiston uchun mo'ljallangan AI-qidiruv va geolokatsiyaga asoslangan mahalliy xizmatlar marketpleysi. Ishonchli, verifikatsiyalangan ustalarni toping — santexnik, elektrik, sartarosh va boshqalar.",
  keywords: [
    "HalQil",
    "mahalliy xizmat",
    "usta topish",
    "santexnik",
    "elektrik",
    "O'zbekiston",
    "marketplace",
    "AI qidiruv",
  ],
  openGraph: {
    title: "HalQil — Har qanday muammoni hal qiling",
    description:
      "AI-qidiruv orqali ishonchli mahalliy ustalarni toping. 100% verifikatsiyalangan mutaxassislar.",
    type: "website",
    locale: "uz_UZ",
    siteName: "HalQil",
  },
};

export default function Home() {
  return <LandingPage />;
}
