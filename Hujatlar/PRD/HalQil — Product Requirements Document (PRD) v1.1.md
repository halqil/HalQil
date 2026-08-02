# **📄 PRODUCT REQUIREMENTS DOCUMENT (PRD) — HalQil Platformasi**

| Loyiha Ma'lumotlari | Tafsilotlar |
| :---- | :---- |
| **Loyiha nomi** | HalQil |
| **Hujjat versiyasi** | 1.1 (Fully Integrated Specification) |
| **Status** | Tasdiqlangan (Approved for Development) |
| **Sana** | 2-Avgust, 2026-yil |

# **1\. Executive Summary (Qisqacha mazmun)**

**HalQil** — O'zbekiston bozori uchun mo'ljallangan, sun'iy intellektga (AI) va geografik joylashuvga asoslangan mahalliy xizmatlar marketpleysi (Single App). Platforma xizmat oluvchilar (mijozlar) hamda xizmat ko'rsatuvchilarni (provayderlar va tashkilotlarni) aqlli AI-qidiruv va katalog orqali tezkor bog'laydi.

Platforma davlat identifikatsiya tizimi (MyID / OneID / PINFL) orqali verifikatsiya qilingan provayderlar va **Escrow** (onlayn muzlatilgan to'lov) mexanizmi orqali shaffof va xavfsiz muhit yaratadi. Monetizatsiya an'anaviy foizli komissiya emas, balki tranzaksiyaga asoslangan qat'iy belgilangan summa (Fixed Fee) modelida ishlaydi.

# **2\. Product Vision & Maqsadli Bozor**

* **Vision:** O'zbekistonda va kelajakda O'rta Osiyo hamda Global bozorda har qanday maishiy, ofis va professional xizmatlarni tez, xavfsiz va shaffof narxlarda "Hal Qiladigan" yagona va eng yirik raqamli ekotizimga aylanish.  
* **Geografik Kengayish:** Toshkent \-\> O'zbekiston shaharlari (Samarqand, Buxoro, Andijon va h.k.) \-\> O'rta Osiyo \-\> Global.  
* **Boshlang'ich Yo'nalish:** Sartaroshxona va Avtoservis xizmatlari (MVP bosqichida).

# **3\. Problem Statement & Value Proposition**

* **Mijozlar Muammosi va Yechim:** Sifatli va ishonchli ustalarni topish qiyinligi, narxlarning sun'iy oshirilishi hamda xavfsizlik kafolati yo'qligi. **Yechim:** Multimodal AI-qidiruv, shaffof narxlar va 100% verifikatsiyalangan usta profillari.  
* **Provayderlar Muammosi va Yechim:** Mijozlar oqimining beqarorligi, raqamli portfolio va reyting yo'qligi. **Yechim:** Tayyor mijozlar oqimi, portfolio galereyasi, ishonchlilik ko'rsatkichi va adolatli nizo tizimi.

# **4\. User Personas & Foydalanuvchi Identifikatsiyasi**

1. **Mijoz (Client):** 16+ yoshdagi har qanday shaxs. Uy-ro'zg'or muammolarini hal qilish yoki sifatli xizmat olish uchun ilova orqali tez va ishonchli usta topishni xohlaydi.  
2. **Provayder (Xizmat ko'rsatuvchi):** Jismoniy shaxs (frilanser/usta) yoki Tashkilot (avtoservis, salon). Halol mehnati orqali reyting yig'ish va barqaror daromad olishni maqsad qilgan.  
3. **WalletID:** Ro'yxatdan o'tishda har bir foydalanuvchiga **10 xonali noyob raqam** beriladi. Bu raqam o'zgarmaydi va ichki hamyon hisob raqami vazifasini o'taydi.

# **5\. User Journey (Foydalanuvchi yo'li)**

1. **Qidiruv:** Mijoz AI chatiga kirib ehtiyojini tasvirlaydi (matn, ovoz yoki rasm yuboradi) yoki katalogdan qidiradi. AI so'rovni tahlil qilib **\[Kategoriya \-\> Skill \-\> Service Type\]** bo'yicha eng mos ustalarni saralaydi.  
2. **Kelishuv:** Mijoz so'rov yuboradi \-\> Provayder 3 ta tanlovdan birini qiladi: **Qabul qilish, Chat ochish yoki Rad etish**. Chat ochilganda narx va shartlar kelishiladi.  
3. **Manzil va Ijro:**  
   * **Tashkilotli xizmatda:** Mijoz salon/avtoservisning aniq manzili va xaritasini darhol ko'radi hamda boradi.  
   * **Tashkilotsiz xizmatda:** Provayder mijozning faqat taxminiy hududini (1 km radius) ko'radi. Provayder **"Yo'lga chiqdim"** tugmasini bosgandagina mijozning aniq manzili ochiladi.  
4. **To'lov:** Mijoz Onlayn (To'lov ID orqali Click/Payme poydevorida **Escrow** statusida) yoki Oflayn (Naqd) to'lov qiladi.  
5. **Yopilish va Reyting:** Har ikkala tomon xizmatni tasdiqlaydi. Tizim Provayder Wallet'idan qat'iy komissiyani yechadi va reytinglarni/ishonchlilik foizini yangilaydi.

# **6\. Functional Requirements (Funksional talablar)**

* **SMS va KYC:** SMS-kod orqali avtorizatsiya. Provayderlar MyID/OneID/Pasport orqali **PINFL (JSHSHIR)** verifikatsiyasidan o'tadi va Admin tasdiqlaydi.  
* **Qayta ro'yxatdan o'tishni bloklash:** Salbiy/qarzdor profili bo'lgan foydalanuvchi yangi SIM-karta bilan ro'yxatdan o'tmoqchi bo'lsa, tizim MyID/PINFL orqali uni 1 yillik arxivdan topib, eski \-50,000 UZS qarzdorligini tiklaydi va provayderlikni bloklaydi.  
* **AI Imkoniyatlari:** Matn, Ovoz (STT) va Rasm orqali qidiruv. Yumshoq limit: max 1000 belgi (jonli counter bilan: 245 / 1000). Kunlik limit: **15 qidiruv/kun**.  
* **Spam Bloki va Timeout:** Mijoz bitta Skill bo'yicha ariza yuborib qabul qilingach, to ish tugatilmaguncha boshqa ariza yubora olmaydi. Provider Response Timeout tugaganda mijoz jarimasiz bekor qila oladi.  
* **Muvaffaqiyatsiz Yakunlash Sabablari:** Provayder xizmatni Muvaffaqiyatsiz deb yopganda majburiy sabab tanlaydi:  
  1. Men bajara olmadim (provayder aybi)  
  2. Mijoz yo'q/kelmadi  
  3. Material yo'q  
  4. Boshqa  
* **Jadval va Tumanlar:** Provayder xizmat ko'rsatadigan tumanlarini (**workDistricts**) va haftalik ish jadvalini (**ProviderSchedule**) sozlashi mumkin.

# **7\. Business Rules, Monetizatsiya va Ishonchlilik Formulalari**

## **7.1. Monetizatsiya Modellari (Daromad Manbalari)**

1. 

| № | Daromad Manbai | Ishlash Mexanizmi |
| :---- | :---- | :---- |
| 1 | **Fixed Fee (Qat'iy summa)** | Platformada foiz olinmaydi. Service Type bo'yicha har bir muvaffaqiyatli xizmat uchun qat'iy summa (masalan, 5,000 UZS) Provayder Wallet'idan yechiladi. |
| 2 | **Obunalar (Subscriptions)** | Provayder/Tashkilot obuna sotib olganda: ma'lum limitgacha komissiya to'lamaydi, qidiruv va katalogda yuqorida ko'rinadi hamda "Tasdiqlangan" (Verified) nishonini oladi. |
| 3 | **Reklama (In-App Ads)** | Tizim ichida tashqi brendlar bannerlari hamda provayderlar va tashkilotlar xizmat joylarini reklama qilish (Sponsored Listings) orqali daromad olinadi. |

## **7.2. Tizim Qoidalari va Limitlar**

* Provayder Hamyoni (Wallet): Hamyon \-50,000 UZSgacha minusga kirib ishlashi mumkin. Undan oshsa profil avtomatik muzlatiladi.  
* Welcome Bonus: Yangi provayderlarga beriladi. Bonus pulni kartaga yechib bo\&apos;lmaydi — faqat komissiya yoki reklama uchun ishlatiladi.  
* Avto-tasdiq: Provayder xizmatni yopgach, mijoz 24 soat ichida munosabat bildirmasa avtomatik Muvaffaqiyatli deb yopiladi.

## **7.3. Ishonchlilik Ko’rsatkichlari (Reliability Score)**

* Provayder uchun: (Muvaffaqiyatli / (Muvaffaqiyatli \+ Muvaffaqiyatsiz)) \* 100%  
* Mijoz uchun: (Muvaffaqiyatli / (Muvaffaqiyatli \+ Bekor qilingan)) \* 100%

# **8\. Escrow, Naqd to'lov va Nizolar (Dispute Logic)**

* **Onlayn To'lov (Escrow):** To'lov ID orqali pul **Pending** holatida muzlatiladi. Xizmat yopilgach **Available** bo'ladi.  
* **Naqd To'lov:** Provayder "Ha, to'lovni oldim" degach xizmat yopiladi va komissiya yechiladi.  
* **Nizolar:** Nizo chiqsa ogohlantirish beriladi: *"Biz nizoni ko'rib chiqish uchun sudga oshiramiz, kerakli hujjatlar va chatlarni taqdim etamiz. HalQil sud xarajatlarini qoplamaydi\!"*. Order statusi **Muzlatilgan (Frozen)** bo'ladi va sud/moderator qarorigacha komissiya ushlanmaydi.

# **9\. Lokatsiya va Maxfiylik (Location Symmetry)**

* **Tashkilotli Xizmat (Salon/Autoserwis):** Aniq manzil va xarita darhol ko'rinadi, lekin telefon raqamlar yashiriladi.  
* **Tashkilotsiz Xizmat (Usta mijoznikiga boradi):** Dastlab 1 km radiusdagi taxminiy hudud ko'rinadi. Aniq manzil usta **"Yo'lga chiqdim"** tugmasini bosgandagina ochiladi.

# **10\. Information Architecture & Admin**

* **Ierarxiya:** Kategoriya \-\> Skill \-\> Service Type.  
* **Support:** Support Chat / Qo\&apos;llab-quvvatlash Chati (`/support`) umumiy murojaatlar uchun.  
* **Bildirishnomalar:** ANNOUNCEMENT, NEWS, WARNING, APPLICATION\_RESPONSE, SYSTEM, DIRECT\_MESSAGE, NEW\_ORDER, CONFIRMATION\_REQUEST, DISPUTE.

# **11\. Xavfsizlik va Texnik Talablar**

* **Filtrlar:** Chatda telefon va karta raqamlari **Regex filtri** orqali bloklanadi.  
* **Moderatsiya:** Moderatorlar chatlarni faqat **Dispute** ochilganda ko'ra oladi.  
* **SLA:** AI javob vaqti \<= 3 soniya. Serverlar O'zbekistonda joylashgan bo'lishi shart.  
* **MVP Platforma:** Single App WebApp (PWA). Telegram Bot \+ Browser Push Notifications.

