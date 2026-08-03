# **PRODUCT REQUIREMENTS DOCUMENT (PRD) — HalQil Platformasi**

**Loyiha nomi:** HalQil  
**Hujjat versiyasi:** 1.1 (Fully Integrated Specification)  
**Status:** Tasdiqlangan (Approved for Development)  
Sana: 3-Avgust, 2026-yil

# **1\. Executive Summary (Qisqacha mazmun)**

**HalQil** — O'zbekiston bozori uchun mo'ljallangan, sun'iy intellektga (AI) va geografik joylashuvga asoslangan mahalliy xizmatlar marketpleysi (Single App). Platforma xizmat oluvchilar (mijozlar) hamda xizmat ko'rsatuvchilarni (provayderlar va tashkilotlarni) aqlli AI-qidiruv va katalog orqali tezkor bog'laydi.

Platforma davlat identifikatsiya tizimi (MyID / OneID / PINFL) orqali verifikatsiya qilingan provayderlar va Escrow (onlayn muzlatilgan to'lov) mexanizmi orqali shaffof va xavfsiz muhit yaratadi. Monetizatsiya an'anaviy foizli komissiya emas, balki tranzaksiyaga asoslangan Fixed Fee (qat'iy belgilangan summa) modelida ishlaydi.

# **2\. Product Vision & Maqsadli Bozor**

* **Vision:** O'zbekistonda va kelajakda O'rta Osiyo hamda Global bozorda har qanday maishiy, ofis va professional xizmatlarni tez, xavfsiz va shaffof narxlarda "Hal Qiladigan" yagona va eng yirik raqamli ekotizimga aylanish.  
* **Geografik Kengayish:** Toshkent \-\> O'zbekiston shaharlari (Samarqand, Buxoro, Andijon va h.k.) \-\> O'rta Osiyo \-\> Global.  
* **Boshlang'ich Yo'nalish:** Sartaroshxona va Avtoservis xizmatlari (MVP bosqichida).

# **3\. Problem Statement & Value Proposition**

* **Mijozlar Muammosi va Yechim:** Sifatli va ishonchli ustalarni topish qiyinligi, narxlarning sun'iy oshirilishi hamda xavfsizlik kafolati yo'qligi. Yechim: Multimodal AI-qidiruv, shaffof narxlar va 100% verifikatsiyalangan usta profillari.  
* **Provayderlar Muammosi va Yechim:** Mijozlar oqimining beqarorligi, raqamli portfolio va reyting yo'qligi. Yechim: Tayyor mijozlar oqimi, portfolio galereyasi, ishonchlilik ko'rsatkichi va adolatli nizo tizimi.

# **4\. User Personas & Foydalanuvchi Identifikatsiyasi**

1. **Mijoz (Client):** 16+ yoshdagi har qanday shaxs. Uy-ro'zg'or muammolarini hal qilish yoki sifatli xizmat (avtoservis, sartaroshxona) olish uchun ilova orqali tez va ishonchli usta topishni xohlaydi.  
2. **Provayder (Xizmat ko'rsatuvchi):** Jismoniy shaxs (frilanser/usta) yoki Tashkilot (avtoservis, salon). Halol mehnati orqali reyting yig'ish, mijozlar bazasini kengaytirish va barqaror daromad olishni maqsad qilgan.  
3. **WalletID:** Ro'yxatdan o'tishda har bir foydalanuvchiga 10 xonali noyob raqam beriladi. Bu raqam o'zgarmaydi va ichki hamyon hisob raqami vazifasini o'taydi.

# **5\. User Journey (Foydalanuvchi yo'li)**

1. **Qidiruv:** Mijoz AI chatiga kirib ehtiyojini tasvirlaydi (matn, ovoz yoki rasm yuboradi) yoki katalogdan qidiradi. AI so'rovni tahlil qilib \[Kategoriya \-\> Skill \-\> Service Type\] bo'yicha eng mos ustalarni saralaydi.  
2. **Kelishuv:** Mijoz so'rov yuboradi \-\> Provayder 3 ta tanlovdan birini qiladi: Qabul qilish, Chat ochish yoki Rad etish. Chat ochilganda narx va shartlar kelishiladi.  
3. **Manzil va Ijro:**  
   * **Tashkilotli xizmatda:** Mijoz salon/avtoservisning aniq manzili va xaritasini darhol ko'radi hamda boradi.  
   * **Tashkilotsiz xizmatda:** Provayder mijozning faqat taxminiy hududini (1 km radius) ko'radi. Provayder "Yo'lga chiqdim" tugmasini bosgandagina mijozning aniq manzili ochiladi.  
4. **To'lov:** Mijoz Onlayn (To'lov ID orqali Click/Payme poydevorida Escrow statusida) yoki Oflayn (Naqd) to'lov qiladi.  
5. **Yopilish va Reyting:** Har ikkala tomon xizmatni tasdiqlaydi. Tizim Provayder Wallet'idan qat'iy komissiyani yechadi va reytinglarni/ishonchlilik foizini yangilaydi.

# **6\. Functional Requirements (Funksional talablar)**

## **6.1. Avtorizatsiya va KYC**

* **Mijoz ro'yxatdan o'tishi:** SMS-kod orqali majburiy avtorizatsiya (1 ta telefon raqam \= 1 ta akkaunt).  
* **Provayder verifikatsiyasi:** Mijoz sifatida ro'yxatdan o'tgach, MyID / OneID / Pasport tizimlari orqali PINFL (JSHSHIR) verifikatsiyasidan o'tadi va ariza qoldiradi. Admin tasdiqlagach provayderlik huquqi beriladi.  
* **Qayta ro'yxatdan o'tishni bloklash:** Salbiy/qarzdor profili bo'lgan foydalanuvchi yangi SIM-karta bilan ro'yxatdan o'tmoqchi bo'lsa, tizim MyID/PINFL orqali uni 1 yillik arxivdan topib, eski \-50,000 UZS qarzdorligini tiklaydi va provayderlikni bloklaydi.

## **6.2. AI Imkoniyatlari va Cheklovlari (Guardrails)**

* **Qidiruv formatlari:** Matn, Ovoz (STT orqali matnga o'giriladi) va Rasm.  
* **Yumshoq Limit (Soft Limit):** AI so'rovi uchun maksimal 1000 belgi. Ekran burchagida jonli belgi sanagichi (`245 / 1000`) ko'rsatib boriladi.  
* **Kunlik limit:** Bitta mijozga kunlik 15 ta AI qidiruv limiti o'rnatiladi.  
* **AI Guardrail:** AI xizmatga aloqador bo'lmagan so'rovlarga ushbu shablon bilan javob beradi: *"Bu savol HalQil xizmatlariga tegishli emas. Agar sizga biror xizmat kerak bo'lsa, uni tasvirlab yozing..."*

## **6.3. Buyurtmalar, Spam Bloki va Provider Response Timeout**

* **Spam Bloki:** Mijoz bitta Skill bo'yicha ariza yuborib u qabul qilingandan so'ng, to ish tugatilmaguncha o'sha Skill bo'yicha boshqa ariza yubora olmaydi.  
* Provider Response Timeout (Provayder Harakatsizligi):  
  * Konfiguratsiya: Har bir Service Type uchun SuperAdmin/Admin alohida javob kutish vaqtini (Timeout \- masalan 15, 30, 60 daqiqa) dinamik sozlaydi.  
  * Inactivity Triggers: Qabul qilingan (ACCEPTED) buyurtmada provayder timeout vaqti ichida chatga xabar yubormasa, narx taklifini bermasa va xizmatni boshlash bo'yicha harakat qilmasa, mijoz jarimasiz bekor qila oladi. Order NO\_RESPONSE\_AFTER\_ACCEPTANCE sababi bilan yopiladi. Provayderga Muvaffaqiyatsiz \+1, mijozga 0\.  
* Mijoz Tashabbusi Bilan Bekor Qilish va Provayder Tasdiqlash Timeouti (Client Cancellation Request Timeout):  
  * Mijoz Bekor Qilish So'rovi: Qabul qilingan buyurtmani mijoz shunchaki bekor qilmoqchi bo'lsa, provayderga tasdiqlash so'rovi yuboriladi.  
  * Kutish Vaqti: Provayder ushbu Service Type uchun belgilangan timeout vaqti ichida so'rovga javob berishi va tasdiqlashi kutiladi.  
  * Provayder Javob Bermaganda Avto-Yopilish: Agar provayder timeout vaqti ichida javob bermasa va tasdiqlamasa, buyurtma tizim tomonidan avtomatik bekor qilinadi.  
  * Ikki Tomonlama Penaliti: Ushbu holatda: Mijozga Muvaffaqiyatsiz \+1 (qabul qilingan buyurtmani bekor qilish tashabbusi uchun); Provayderga Muvaffaqiyatsiz \+1 (so'rovga timeout ichida javob bermagani va harakatsizligi uchun).

## **6.4. Muvaffaqiyatsiz Yakunlash Sabablari (Failure Reasons)**

Provayder xizmatni Muvaffaqiyatsiz deb yopganda quyidagi sabablardan birini majburiy tanlaydi:

1. Men bajara olmadim (Provayder aybi — ishonchlilik foizi va reytingi pasayadi).  
2. Mijoz yo'q / kelmadi.  
3. Material / ehtiyot qism yo'q.  
4. Boshqa sabab.

## **6.5. Provayder Profili, Jadval va Tumanlar**

* **Tumanlar bo'yicha ishlash (workDistricts):** Provayder o'zi xizmat ko'rsatadigan tumanlarni belgilaydi.  
* **Haftalik Jadval (ProviderSchedule):** Haftaning kunlari bo'yicha ish vaqtlari (ochilish, yopilish soatlari va aktivlik holati) sozlanadi.  
* **Portfolio Galereyasi:** Bajarilgan ishlar fotolarini yuklash imkoniyati.

# **7\. Business Rules, Monetizatsiya va Ishonchlilik Formulalari**

## **7.1. Monetizatsiya Modellari (Daromad Manbalari)**

| № | Daromad Manbai | Ishlash Mexanizmi |
| :---- | :---- | :---- |
| 1 | **Fixed Fee (Qat'iy summa)** | Platformada foiz olinmaydi. Service Type bo'yicha har bir muvaffaqiyatli xizmat uchun qat'iy summa (masalan, 5,000 UZS) Provayder Wallet'idan yechiladi. |
| 2 | **Obunalar (Subscriptions)** | Provayder/Tashkilot obuna sotib olganda: ma'lum limitgacha komissiya to'lamaydi, qidiruv va katalogda yuqorida ko'rinadi hamda "Tasdiqlangan" (Verified) nishonini oladi. |
| 3 | **Reklama (In-App Ads)** | Tizim ichida tashqi brendlar bannerlari hamda provayderlar va tashkilotlar xizmat joylarini reklama qilish (Sponsored Listings) orqali daromad olinadi. |

## **7.2. Tizim Qoidalari va Limitlar**

* **Provayder Hamyoni (Wallet):** Hamyon \-50,000 UZSgacha minusga kirib ishlashi mumkin. Undan oshsa profil avtomatik muzlatiladi.  
* **Welcome Bonus:** Yangi provayderlarga beriladi. Bonus pulni kartaga yechib bo'lmaydi — faqat platforma komissiyasini yoki ichki reklamani qoplashga ishlatiladi.  
* **Avto-tasdiq:** Provayder xizmatni yopgach, mijoz 24 soat ichida munosabat bildirmasa avtomatik Muvaffaqiyatli deb yopiladi.

## **7.3. Ishonchlilik Ko'rsatkichlari (Reliability Score)**

* **Provayder uchun:** (Muvaffaqiyatli / (Muvaffaqiyatli \+ Muvaffaqiyatsiz)) \* 100%  
* **Mijoz uchun:** (Muvaffaqiyatli / (Muvaffaqiyatli \+ Bekor qilingan)) \* 100%

# **8\. Escrow, Naqd to'lov va Nizolar (Dispute Logic)**

## **8.1. Onlayn To'lov (Escrow)**

* Chat ichida o'zgarmas To'lov ID yaratiladi. Mijoz (Click/Payme orqali) to'laganda, pul provayder hamyonida Pending (Kutilmoqda) holatida muzlatiladi.  
* Xizmat muvaffaqiyatli yopilgach, pul Available (Mavjud) holatiga o'tadi.  
* Bekor qilinganda yoki nizo mijoz foydasiga hal bo'lganda, pul API orqali mijoz kartasiga qaytariladi.

## **8.2. Naqd To'lov**

* Provayder xizmatni yopayotganda tizim so'raydi: *"Mijoz xizmatingiz uchun naqd to'lov qildimi?"*. Provayder *"Ha, to'lovni oldim"* desa, xizmat yopilib, Wallet'dan komissiya ushlanadi.

## **8.3. Sud va Muzlatilgan (Frozen) Status**

* Naqd to'lov yoki boshqa kelishmovchilikda tomonlardan biri \*"Shikoyat qilish"\*ni bossa, tizim ogohlantiradi: *"Biz nizoni ko'rib chiqish uchun sudga oshiramiz, kerakli hujjatlar, chatlar va dalillarni sudning so'roviga muvofiq taqdim etamiz. HalQil sud xarajatlarini qoplamaydi\!"*  
* Nizo davomida buyurtma Muzlatilgan (Frozen) holatiga o'tkaziladi va sud/moderator yakuniy qarorini chiqarguncha komissiya yechilmaydi.  
* Yolg'on shikoyat qilgan tarafga Firibgarlik \+1 va Muvaffaqiyatsiz \+1 statistikasi beriladi.

# **9\. Lokatsiya va Maxfiylik (Location Symmetry)**

* **Tashkilotli Xizmatda (Mijoz usta/salon oldiga boradi):** Mijoz AI qidiruvi va katalogda salon/avtoservisning aniq manzili va xaritasini darhol ko'radi. Lekin telefon raqamlari yashiriladi (muloqot faqat HalQil chatida bo'ladi).  
* **Tashkilotsiz Xizmatda (Usta mijoz huzuriga boradi):** So'rov yuborilayotganda provayder mijozning faqat taxminiy hududini (1 km radius) ko'radi. Aniq manzil va xarita usta "Yo'lga chiqdim" tugmasini bosgandagina ochiladi va mijozga bildirishnomalar yuboriladi.

# **10\. Information Architecture (Ma'lumotlar Ierarxiyasi)**

\[Kategoriya\] (masalan: Avtoservis)

   └── \[Skill\] (masalan: Avtoelektrik)

        └── \[Service Type\] (masalan: Elektr diagnostika)

             ├── Pricing Rules (Fixed Sum / Kelishuv / Min-Max)

             ├── Provider Response Timeout Configuration

             └── Platform Fixed Commission Fee

# **11\. Qo'llab-quvvatlash va Bildirishnomalar Tizimi**

## **11.1. Support Chat (Qo'llab-quvvatlash Chati)**

Foydalanuvchilar va Provayderlar uchun umumiy savollar, ariza holatini aniqlash hamda texnik yordam olish uchun alohida Support Chat moduli (/support) mavjud.

## **11.2. Bildirishnomalar Klassifikatsiyasi (Notification Types)**

Tizim bildirishnomalari quyidagi turlarga bo'linadi:

* `ANNOUNCEMENT` — Tizim e'lonlari  
* `NEWS` — Yangiliklar  
* `WARNING` — Ogohlantirishlar va qoidabuzarliklar  
* `APPLICATION_RESPONSE` — Provayderlik arizasi javobi  
* `SYSTEM` — Texnik xabarlar  
* `DIRECT_MESSAGE` — To'g'ridan-to'g'ri xabar  
* `NEW_ORDER` — Yangi buyurtma kelgani  
* `CONFIRMATION_REQUEST` — Tasdiqlash so'rovi  
* `DISPUTE` — Nizo va shikoyat xabarlari

*Eslatma: `isGlobal=true` bo'lgan bildirishnomalar barcha foydalanuvchilarga avtomatik ko'rsatiladi.*

# **12\. Information Security & Privacy (Xavfsizlik)**

* **Chat Filtrlash:** Chatda telefon raqamlari hamda plastik karta raqamlarini yuborish Regex filtrlari orqali qat'iy bloklanadi.  
* **Privacy by Design:** Moderatorlar shaxsiy chatlarni faqat rasmiy Nizo (Dispute) ochilgandagina ko'rish huquqiga ega bo'ladilar.  
* **Audit Log:** Tizimdagi barcha harakatlar avtomatik Audit Log'da qayd etiladi.  
* **Pul yechish (Withdrawal):** MVP bosqichida provayderlarning pul yechish so'rovlari Moliya xodimi/Moderator tomonidan faqat qo'lda tekshirilib tasdiqlanadi.

# **13\. Non-Functional Requirements (Texnik talablar)**

* **Latency (SLA):** AI qidiruvi va javob qaytarish muddati maksimal 3 soniya.  
* **Concurrency:** Tizim bir vaqtning o'zida uzilishlarsiz 1000 nafar faol foydalanuvchini (Concurrent Users) ko'tarishi shart.  
* **Data Residency:** Balla serverlar O'zbekiston Respublikasi hududidagi mahalliy ma'lumotlar markazlarida (Uzinfocom / Uztelecom) joylashtiriladi.  
* **Soft Delete & Archive:** O'chirilgan akkauntlar va ma'lumotlar bazada 1 yil davomida yashirin (Arxiv) saqlanadi.

# **14\. API & Third-Party Integrations (Integratsiyalar)**

* **Payment Gateway API:** Click, Payme, Uzum Bank.  
* **Identity API:** MyID / OneID rasmiy integratsiyasi.  
* **AI API:** LLM (OpenAI / Open-source fine-tuned model), Speech-to-Text va Vision API.  
* **Maps API:** Yandex Maps / Google Maps URL-schemes.  
* **Notification API:** Telegram Bot API va Web Push Notification API.

# **15\. Analytics & KPIs (Metrikalar)**

* **North Star Metric:** Oylik Muvaffaqiyatli Yakunlangan Tranzaksiyalar / Xizmatlar Soni (*Monthly Successful Transactions*).  
* **Secondary KPIs:**  
  * MAU (Monthly Active Users).  
  * Provider Retention & Wallet Health.  
  * Dispute Rate (Nizolar nisbati \- 2% dan past bo'lishi shart).

# **16\. Technical Architecture & MVP Scope**

* **Platforma turi:** Custom Noldan Dasturlash. Single App (Bitta ilova — provayderlar mijoz sifatida ham buyurtma bera oladi).  
* **Frontend (MVP):** WebApp (PWA).  
* **Xabarnomalar (Notifications) MVP:**  
  1. Telegram Bot integratsiyasi.  
  2. Browser Push-notifications.  
  3. In-app bildirishnomalar.  
* **Post-MVP Reja:** Flutter/React Native orqali iOS va Android ilovalar, SMS integratsiyasi, In-app xaritalar.

# **17\. User Roles & Permission Matrix (Rollar va Ruxsatnomalar Matritsasi)**

| Funktsiya / Ruxsatnoma | Client (Mijoz) | Provider (Usta) | Org Admin | Support/Moderator | Admin | SuperAdmin |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| AI Qidiruv va Buyurtma berish | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Buyurtma qabul qilish / rad etish | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Wallet / Balans to'ldirish | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Pul yechish so'rovini yuborish | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Pul yechishni tasdiqlash | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Nizo (Dispute) ko'rib chiqish | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| User/Provider muzlatish/bloklash | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Kategoriya va Skill qo'shish | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Broadcast Notification yuborish | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit Log va Moliya boshqaruvi | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

# **18\. Information Architecture & Screen Flow (Axborot Strukturasi va Ekranlar)**

\[HalQil Web App (Single App)\]  
├── \[Guest / Unauthenticated\]  
│   ├── Bosh Sahifa (Landing & Service Discovery)  
│   ├── Classic Qidiruv (/search)  
│   │  
│   ├── Katalog (/catalog)  
│   │   ├── Kategoriya (/catalog/\[category\])  
│   │   │   ├── Providers (/catalog/\[category\]/providers)  
│   │   │   │   └── Provider (/providers/\[provider\])  
│   │   │   └── Organizations (/catalog/\[category\]/organizations)  
│   │   │       └── Organization (/organizations/\[organization\])  
│   │   │  
│   │   ├── Skill (/catalog/\[category\]/\[skill\])  
│   │   │   ├── Providers (/catalog/\[category\]/\[skill\]/providers)  
│   │   │   │   └── Provider (/providers/\[provider\])  
│   │   │   └── Organizations (/catalog/\[category\]/\[skill\]/organizations)  
│   │   │       └── Organization (/organizations/\[organization\])  
│   │   │  
│   │   └── Service Type (/catalog/\[category\]/\[skill\]/\[service-type\])  
│   │       ├── Providers (/catalog/\[category\]/\[skill\]/\[service-type\]/providers)  
│   │       │   └── Provider (/providers/\[provider\])  
│   │       └── Organizations (/catalog/\[category\]/\[skill\]/\[service-type\]/organizations)  
│   │           └── Organization (/organizations/\[organization\])  
│   └── Auth / SMS Login (/auth/login)  
│  
└── \[Authenticated User\]  
    ├── Home (/home)  
    ├── AI Chat Qidiruv (/ai-search)  
    ├── Classic Qidiruv (/search)  
    │  
    ├── Katalog (/catalog)  
    │   ├── Kategoriya (/catalog/\[category\])  
    │   │   ├── Providers (/catalog/\[category\]/providers)  
    │   │   │   └── Provider (/providers/\[provider\])  
    │   │   └── Organizations (/catalog/\[category\]/organizations)  
    │   │       └── Organization (/organizations/\[organization\])  
    │   │  
    │   ├── Skill (/catalog/\[category\]/\[skill\])  
    │   │   ├── Providers (/catalog/\[category\]/\[skill\]/providers)  
    │   │   │   └── Provider (/providers/\[provider\])  
    │   │   └── Organizations (/catalog/\[category\]/\[skill\]/organizations)  
    │   │       └── Organization (/organizations/\[organization\])  
    │   │  
    │   └── Service Type (/catalog/\[category\]/\[skill\]/\[service-type\])  
    │       ├── Providers (/catalog/\[category\]/\[skill\]/\[service-type\]/providers)  
    │       │   └── Provider (/providers/\[provider\])  
    │       └── Organizations (/catalog/\[category\]/\[skill\]/\[service-type\]/organizations)  
    │           └── Organization (/organizations/\[organization\])  
    │  
    ├── Providers (/providers)  
    │   └── Provider (/providers/\[provider\])  
    │  
    ├── Organizations (/organizations)  
    │   └── Organization (/organizations/\[organization\])  
    │       ├── About  
    │       ├── Gallery  
    │       ├── Reviews  
    │       │  
    │       ├── Providers (/organizations/\[organization\]/providers)  
    │       │   └── Provider (/providers/\[provider\])  
    │       │  
    │       └── Catalog (/organizations/\[organization\]/catalog)  
    │           ├── Kategoriya (/organizations/\[organization\]/catalog/\[category\])  
    │           │   ├── Providers (/organizations/\[organization\]/catalog/\[category\]/providers)  
    │           │   │   └── Provider (/providers/\[provider\])  
    │           │   └── Skill (/organizations/\[organization\]/catalog/\[category\]/\[skill\])  
    │           │  
    │           ├── Skill (/organizations/\[organization\]/catalog/\[category\]/\[skill\])  
    │           │   ├── Providers (/organizations/\[organization\]/catalog/\[category\]/\[skill\]/providers)  
    │           │   │   └── Provider (/providers/\[provider\])  
    │           │   └── Service Type (/organizations/\[organization\]/catalog/\[category\]/\[skill\]/\[service-type\])  
    │           │  
    │           └── Service Type (/organizations/\[organization\]/catalog/\[category\]/\[skill\]/\[service-type\])  
    │               └── Providers (/organizations/\[organization\]/catalog/\[category\]/\[skill\]/\[service-type\]/providers)  
    │                   └── Provider (/providers/\[provider\])  
    │  
    ├── Buyurtmalar (/orders)  
    │   ├── Yuborilgan Buyurtmalar (/orders/requested)  
    │   │   └── Buyurtma Tafsiloti (/orders/requested/\[order\])  
    │   │  
    │   └── Kelgan Buyurtmalar (/orders/received)  
    │       └── Buyurtma Tafsiloti (/orders/received/\[order\]) \[Provider Mode\]  
    │  
    ├── Chatlar (/chat)  
    │   └── Chat (/chat/\[chat\])  
    │  
    ├── Dashboard (/provider/dashboard) \[Provider Mode\]  
    ├── Wallet (/provider/wallet) \[Provider Mode\]  
    ├── Provider Profile & Schedule (/provider/profile) \[Provider Mode\]  
    ├── Provider Settings (/provider/settings) \[Provider Mode\]  
    ├── Organization Management (/provider/organization) \[Organization Accounts Only\]  
    │  
    ├── Support Chat (/support)  
    ├── Profil (/profile)  
    └── Settings (/settings)

# **19\. Acceptance Criteria & Definition of Done (Qabul Qilish Mezonlari)**

## **19.1. AI Search Epic**

* User matn, ovozli xabar yoki rasm yuborganda AI 3 soniya ichida mos Service Type va ustalarni qaytarishi kerak.  
* So'rov 1000 belgidan oshganda bloklanishi va jonli counter to'g'ri ishlashi kerak.  
* Xizmatga aloqador bo'lmagan so'rovlarga guardrail shablon javobi qaytishi shart.

## **19.2. Escrow & Wallet Epic**

* Click/Payme orqali to'lov qilinganda pul Pending holatida muzlatilishi kerak.  
* Xizmat yopilgach pul Available statusiga o'tishi va provayder hamyonidan qat'iy komissiya yechilishi kerak.  
* Wallet \-50,000 UZS dan oshganda provayder profili muzlatilishi kerak.

## **19.3. KYC & Fraud Prevention Epic**

* MyID/OneID orqali PINFL (JSHSHIR) verifikatsiyasi o'tkazilishi shart.  
* Qarzdor/salbiy foydalanuvchi yangi SIM-karta bilan kirganda PINFL orqali avtomatik aniqlanib bloklanishi shart.

# **20\. Development Roadmap & Milestones (Ishga Tushirish Bosqichlari)**

| Bosqich | Muddat | Asosiy Deliverable va Vazifalar |
| :---- | :---- | :---- |
| **Phase 1: Architecture & DB** | 2-3 Hafta | Data schema (PostgreSQL), 121-step state machine, Auth & Audit log. |
| **Phase 2: Backend & AI Engine** | 4-5 Hafta | AI Prompt Engine \+ Soft limit (1000 char), MyID va Click/Payme integratsiyasi. |
| **Phase 3: Frontend (PWA) & Admin** | 4-5 Hafta | WebApp UI/UX, Telegram Bot API, Admin/Moderator Portal va Dispute flow. |
| **Phase 4: QA & Soft Launch** | 2 Hafta | Load testing (1000 concurrent users), Penetration testing, Beta launch (Toshkent). |

# **21\. Risk Management & Mitigation Matrix (Xatarlar va Ularni Yumshatish)**

| Xatar Turi | Xatar Tasviri | Ehtimollik | Ta'siri | Yumshatish Chora-tadbirlari (Mitigation) |
| :---- | :---- | :---- | :---- | :---- |
| **Texnik** | AI API latency \> 3 soniya bo'lishi | O'rta | Yuqori | Model so'rovlarini keshlashtirish (Redis) va yengil STT modellaridan foydalanish. |
| **Biznes** | Mijoz va provayder oflayn kelishishi | Yuqori | Yuqori | Past qat'iy komissiya, obuna bonuslari va Escrow xavfsizlik kafolati. |
| **Yuridik** | Naqd to'lovdagi kelishmovchiliklar | O'rta | O'rta | Order statusini Muzlatilgan qilish va sud tartibiga oshirish. |
| **Xavfsizlik** | Chatda kontaktlarni ulashib ketish | Yuqori | O'rta | Chatda Regex filtrlari orqali raqamlarni avtomatik maskalash/bloklash. |

# **22\. Appendix & Glossary (Atamalar Lug'ati)**

* **Escrow:** Onlayn to'langan pulni xizmat muvaffaqiyatli tugagunicha uchinchi xavfsiz hisobda muzlatib turish mexanizmi.  
* **Fixed Fee:** Xizmat foizida emas, balki tranzaksiya uchun belgilangan qat'iy summa (masalan 5,000 UZS) komissiya yechish usuli.  
* **PINFL (JSHSHIR):** Jismoniy shaxsning shaxsiy identifikatsiya raqami — davlat pasport tizimidagi noyob kod.  
* **Single App:** Mijoz va Provayder funksiyalarini bitta ilova va foydalanuvchi hisobi ichida jamlash konsepsiyasi.  
* **Soft Delete:** Ma'lumotlarni bazadan to'liq o'chirmasdan, arxiv statusida 1 yil saqlash usuli.  
* **Guardrails:** AI modelining platforma doirasidan tashqari mavzularga javob berishini taqiqlovchi xavfsizlik chegaralari.

