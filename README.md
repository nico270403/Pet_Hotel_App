# 🐾 Pet Hotel App

## Repository
   Link: https://github.com/nico270403/Pet_Hotel_App
   Vizibilitate: Public

   
Aplicație mobilă full-stack pentru căutarea, rezervarea și administrarea unităților de cazare pentru animale de companie. Aplicația are două fluxuri complet separate — unul pentru clienți (proprietari de animale care caută și rezervă cazare) și unul pentru manageri (administratori de hoteluri pentru animale) — plus un asistent conversațional AI care ajută clientul să găsească și să rezerve o cazare direct din chat.

> Lucrare de licență — Aplicație practică

---

## Cuprins

1. [Descriere generală](#descriere-generală)
2. [Funcționalități principale](#funcționalități-principale)
3. [Arhitectură și tehnologii](#arhitectură-și-tehnologii)
4. [Structura proiectului](#structura-proiectului)
5. [Cerințe preliminare](#cerințe-preliminare)
6. [Schema bazei de date](#schema-bazei-de-date)
7. [Variabile de mediu](#variabile-de-mediu-backend)
8. [Clonare repository](#clonare-repository)
9. [Intrare în folderul aplicației](#intrare-în-folderul-aplicației)
10. [Instalare și rulare — Backend](#instalare-și-rulare--backend)
11. [Configurație frontend](#configurație-frontend)
12. [Instalare și rulare — Frontend (Expo)](#instalare-și-rulare--frontend-expo)
13. [Rulare pe telefon](#rulare-pe-telefon)
14. [Configurare asistent AI (Ollama)](#configurare-asistent-ai-ollama)
15. [Configurare plăți (Stripe)](#configurare-plăți-stripe)
16. [Configurare notificări și e-mail](#configurare-notificări-și-e-mail)
17. [Limitări cunoscute](#limitări-cunoscute)
18. [Autor](#autor)

---

## Descriere generală

**Pet Hotel App** conectează proprietarii de animale de companie cu unități de cazare specializate (pet hoteluri). Aplicația oferă:

- pentru **client**: căutare hoteluri după oraș și tip de animal, rezervare prin formular clasic sau printr-un **chatbot AI conversațional**, plată online, istoric rezervări, recenzii;
- pentru **manager**: adăugarea și administrarea unităților de cazare, panou de control cu statistici de ocupare și venituri, aprobare/respingere/anulare rezervări, calendar de disponibilitate.

Frontend-ul este o aplicație **React Native (Expo)**, rulată pe Android printr-un **development build custom** generat cu EAS (nu Expo Go standard, din cauza modulelor native `react-native-maps` și `@stripe/stripe-react-native`), iar backend-ul este un server **Node.js / Express** conectat la o bază de date **PostgreSQL**, cu un model LLM local (**Ollama**) pentru asistentul de chat.

---

## Funcționalități principale

###  Client
- Autentificare / înregistrare / mod oaspete
- Listă hoteluri (cu imagini, rating, descriere) + hartă interactivă
- Profil animale de companie (specie, rasă, vârstă, alergii)
- **Asistent AI conversațional** (chat) care:
  - extrage automat orașul și tipul de animal din mesaj;
  - recomandă hoteluri disponibile;
  - poate finaliza o rezervare complet din conversație (flux pas cu pas: animal → proprietar → date → confirmare).
- Rezervare și prin formular clasic, cu calendar de disponibilitate în timp real
- Sugestii automate de perioade alternative dacă hotelul este ocupat în intervalul dorit
- Istoric rezervări cu status (în așteptare / aprobată / plătită / respinsă / anulată / expirată)
- Plată online cu **Stripe**
- Recenzii și rating după finalizarea sejurului
- Notificări push (Expo) la aprobarea rezervării

###  Manager
- Autentificare / înregistrare cont manager (inclusiv din modul oaspete, cu creare cont în același flux de adăugare hotel)
- Adăugare unitate de cazare (imagine principală + galerie, locație, capacitate, preț, animale acceptate)
- Editare date hotel
- Dashboard cu:
  - locuri ocupate / libere pe zi selectată;
  - rată de ocupare (grafic circular);
  - defalcare pe specii de animale;
  - venit calculat pe interval de date selectabil din calendar;
  - calendar cu zile marcate în funcție de rezervări (în așteptare / confirmate).
- Aprobare / respingere / anulare / ștergere rezervări (cu notificare automată pe e-mail către client)
- Adăugare manuală de rezervări (ex. pentru clienți care sună telefonic)
- Suport pentru mai multe unități de cazare pe cont

---

## Arhitectură și tehnologii

### Frontend — `React Native` + `Expo`
| Categorie | Tehnologie |
|---|---|
| Navigare | `@react-navigation/native`, `native-stack`, `bottom-tabs` |
| Stare globală | React Context (`AuthContext.js`) |
| Stocare locală | `AsyncStorage` |
| Hărți | `react-native-maps` |
| Calendar | `react-native-calendars` |
| Plăți | `@stripe/stripe-react-native` |
| Imagini | `expo-image-picker` |
| Notificări | `expo-notifications`, `expo-device` |
| Iconițe | `@expo/vector-icons` (Ionicons) |

### Backend — `Node.js` + `Express`
| Categorie | Tehnologie |
|---|---|
| Server web | `express`, `cors` |
| Bază de date | `pg` (PostgreSQL) |
| Autentificare | `bcrypt` (hash parole), `jsonwebtoken` (JWT) |
| Upload fișiere | `multer` |
| E-mail | `nodemailer` (SMTP Gmail) |
| Plăți | `stripe` |
| Notificări push | `expo-server-sdk` |
| Asistent AI | `Ollama` (model local `llama3.2:3b`) + logică RAG proprie (`rag-simple.js`) peste datele din baza de date (hoteluri, animale) |

### De ce Ollama local și nu un API extern de AI?
Asistentul de chat (`rag-simple.js`) rulează **local**, pe modelul `llama3.2:3b`, servit prin Ollama pe `localhost:11434`. Acest lucru elimină costurile per-request și permite funcționarea offline față de internet (dar necesită resurse hardware locale pentru inferență). Serverul face "warmup" automat la modelul AI de fiecare dată când se deschide ecranul principal (`HomeScreen.js`), pentru a reduce latența primului răspuns.

---

## Structura proiectului

> Structura de mai jos e organizată logic pe baza fișierelor din proiect

```
pet-hotel-app/
├── backend/
│   ├── index.js                 # entry point Express, montare rute, conexiune PostgreSQL
│   ├── db.js                    # pool de conexiune PostgreSQL (pg)
│   └── routes/
│       ├── chat.js              #  chatbot AI
│       ├── auth.js              #  autentificare, resetare parolă
│       ├── book.js              #  creare rezervări, aprobare/respingere
│       ├── dashboard.js         #  gestionare rezervări, statistici manager
│       ├── payment.js           #  integrare Stripe
│       ├── reviews.js           #  recenzii
├       ├── rag-simple.js        #  logica asistentului AI (RAG + Ollama)
│       ├── dateParser.js        #  parsare date în limbaj natural (RO)
│       ├── dateValidator.js     #  validare format și corectitudine dată
│       └── hotelImages.js       #  galerie imagini hotel
│
└── frontend/
    ├── App.js                   # navigație principală (Stack + Tabs), routare pe rol
    ├── index.js                 # entry point Expo
    ├── api.js                   # API_BASE_URL 
    ├── database.js              # SQLite local (fallback offline)
    ├── dbHelpers.js             # interogări SQLite locale
    ├── seedHelpers.js           # populare date demo la prima rulare
    ├── context/
    │   └── AuthContext.js       # login/register/logout, sesiune, push token
    └── screens/
        ├── WelcomeScreen.js
        ├── AuthScreen.js
        ├── HomeScreen.js
        ├── HotelDetailsScreen.js
        ├── ReservationScreen.js
        ├── ChatScreen.js
        ├── BookingsScreen.js
        ├── ReviewScreen.js
        ├── PetProfileScreen.js
        ├── PetBackground.js
        ├── HotelDashboardScreen.js
        ├── AddHotelScreen.js
        ├── EditHotelScreen.js
        └── AdaugaRezervareScreen.js
```

---

## Cerințe preliminare

- [Node.js](https://nodejs.org/) (recomandat LTS, v18+) și npm
- [PostgreSQL](https://www.postgresql.org/) instalat și pornit local (sau accesibil în rețea)
- [Ollama](https://ollama.com/) instalat local, pentru asistentul AI
- Cont [Expo](https://expo.dev/signup) (gratuit), necesar pentru `eas login` și pentru build-uri EAS
- `eas-cli` (se instalează automat la prima rulare a comenzii `npx eas ...`, sau manual cu `npm install -g eas-cli`)
- Telefon Android pe care se instalează build-ul de dezvoltare generat de EAS (**nu** Expo Go din Google Play — aplicația nu funcționează în Expo Go standard din cauza modulelor native folosite)
- Telefonul Android și calculatorul pe care rulează backend-ul trebuie să fie **în aceeași rețea Wi-Fi**
-  Cont [Stripe](https://dashboard.stripe.com/register) pentru chei de test, dacă se dorește testarea plății
-  Un cont Gmail cu [parolă de aplicație](https://support.google.com/accounts/answer/185833) generată, pentru trimiterea de e-mailuri (confirmări, resetare parolă)

---

## Schema bazei de date

Tabele principale folosite de backend:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL,          -- 'client' sau 'manager'
    reset_code VARCHAR(6),
    reset_code_expires TIMESTAMP,
    expo_push_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    county VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    manager_id INTEGER REFERENCES users(id),
    image_url TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    capacity INTEGER DEFAULT 5,
    price_per_day INTEGER DEFAULT 100,
    short_description TEXT,
    long_description TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    currency VARCHAR(10) DEFAULT 'RON'
);

CREATE TABLE animals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE hotel_animals (
    hotel_id INTEGER REFERENCES hotels(id),
    animal_id INTEGER REFERENCES animals(id)
);

CREATE TABLE hotel_images (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id),
    image_url VARCHAR(255) NOT NULL
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id),
    user_id INTEGER REFERENCES users(id),
    animal_id INTEGER REFERENCES animals(id),
    pet_name VARCHAR(100),
    pet_type VARCHAR(100),
    owner_email VARCHAR(150),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_total NUMERIC(10,2),
    currency VARCHAR(10) DEFAULT 'RON',
    status VARCHAR(20) DEFAULT 'pending',       
    reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id),
    user_id INTEGER REFERENCES users(id),
    booking_id INTEGER REFERENCES bookings(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```


---

## Variabile de mediu (backend)

Se creează un fișier `.env` în folderul backend-ului:

```env
# Bază de date
DB_HOST=localhost
DB_USER=postgres
DB_PASS=parola_postgres
DB_NAME=app_hotel
DB_PORT=5432

# Autentificare
JWT_SECRET=..

# E-mail (Gmail cu parolă de aplicație)
EMAIL_USER=adresa@gmail.com
EMAIL_PASS=parola_de_aplicatie_gmail
EMAIL_ADMIN=email_backup_manager@exemplu.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Server
PORT=3000
BACKEND_URL=http://IP_LOCAL_AL_CALCULATORULUI:3000
NODE_ENV=development
```

> `BACKEND_URL` este folosit pentru linkurile de aprobare/respingere rezervare trimise prin e-mail managerului — trebuie să fie adresa IP din rețeaua locală, nu `localhost`, ca link-ul să funcționeze și de pe alt dispozitiv.

---

## Clonare repository

```bash
git clone https://github.com/nico270403/Pet_Hotel_App.git hotel-app
```

## Intrare în folderul aplicației

```bash
cd hotel-app
```


## Instalare și rulare — Backend

```bash
# 1. Se intră în folderul backend

cd backend


# 2. Se instalează dependențele

npm install

# 3. Se creează și se completează fișierul .env (secțiunea de mai sus - Variabile de mediu)

# 4. Se asigură faptul că PostgreSQL rulează și baza de date există,
#    apoi se rulează scriptul de creare a tabelelor (schema din secțiunea anterioară)

# 5. Se pornește serverul

npm start

```

La pornire cu succes se vede în consolă:
```
Conectat la PostgreSQL - TEST SUCCESS
Backend Server pornit!
Local: http://localhost:3000
Rețea: http://<IP-ul local>:3000
```

Important **adresa IP din rețea** afișată — va fi folosită în frontend.

---

## Configurație frontend 

Configurația se află în fișierul `app.json`, la cheia `expo.extra`:

```json
"extra": {
  "STRIPE_PUBLISHABLE_KEY": "pk_test_...",
  "BACKEND_URL": "http://<IP-ul local>:3000",
  "eas": { "projectId": "..." }
}
```

> ⚠️ **Notă:** `BACKEND_URL` din `app.json → extra` nu este citit automat de cod — 
> `api.js` are propriul `API_BASE_URL`, complet independent. Cele două valori 
> trebuie actualizate manual, separat (vezi și secțiunea „Instalare și rulare — 
> Frontend" de mai jos).
>
> ⚠️ De asemenea, `app.json → android.config.googleMaps.apiKey` conține 
> cheia Google Maps API necesară pentru `react-native-maps`.

## Instalare și rulare — Frontend (Expo)

```bash
# 1. Se intră în folderul frontend

cd ..

# 2. Se instalează dependențele

npm install

```

**Important:** aplicația are adresa backend-ului scrisă direct în cod (`api.js` și de acolo este importată), momentan setată la o adresă IP fixă (`172.20.10.2`). Înainte de rularea aplicației, se actualizează cu IP-ul local al calculatorului (același afișat de backend la pornire):

- `./api.js` → constanta `API_BASE_URL`
- `./context/AuthContext.js` → import-ul `API_BASE_URL`
- restul ecranelor importă deja `API_BASE_URL` din `api.js`, deci e suficient schimbarea valorii într-un singur loc


## Rulare pe telefon

**1. Autentificare EAS (o singură dată):**
```bash
npx eas login
```

**2. Generare build de dezvoltare (APK, pe serverele Expo/EAS Build):**

```bash
npx eas build --profile development --platform android
```

Acest lucru pornește un build în cloud. La final, EAS oferă un link de descărcare a .apk-ului.

**3. Instalare APK pe telefon:**

Se descarcă link-ul primit direct pe telefon (sau se scanează codul QR afișat de EAS CLI la finalul build-ului) și se instalează APK-ul.

Acest pas se repetă doar când se schimbă dependențele native (ex: se adaugă un nou pachet cu cod nativ). Pentru modificări de JS/cod React, nu e nevoie de rebuild.

**4. Pornire frontend:**

```bash
npx expo start --dev-client
```

**5. Conectare telefon**

Se deschide aplicația custom instalată la pasul 3 (nu Expo Go) și se scanează codul QR afișat în terminal. Telefonul și calculatorul trebuie să fie pe aceeași rețea Wi-Fi.


---

## Configurare asistent AI (Ollama)

```bash
# 1. Instalare Ollama (https://ollama.com/download)

# 2. Descărcare model folosit de aplicație
ollama pull llama3.2:3b

# 3. Ollama pornește automat un server local pe:
#    http://localhost:11434
```

Backend-ul apelează automat un endpoint de "încălzire" (`/api/chat/warmup`) atunci când se deschide ecranul principal al aplicației, pentru ca primul răspuns al asistentului AI să nu fie lent. Dacă Ollama nu rulează, acest apel eșuează silențios, iar chatul AI nu va funcționa (restul aplicației rămâne funcțional).

---

## Configurare plăți (Stripe)

1. Creare cont gratuit pe [dashboard.stripe.com](https://dashboard.stripe.com/register).
2. Din secțiunea **Developers → API keys**, copiere chei de test:
   - `Secret key` → `STRIPE_SECRET_KEY` în `.env`-ul backend-ului;
   - `Publishable key` → `STRIPE_PUBLISHABLE_KEY` în `app.json → expo.extra`.
3. Pentru testare, se folosește un [card de test Stripe](https://docs.stripe.com/testing) (ex: `4242 4242 4242 4242`, orice dată viitoare, orice CVC).

---

## Configurare notificări și e-mail

- **E-mail**: necesită un cont Gmail cu [parolă de aplicație](https://myaccount.google.com/apppasswords) (nu parola normală de Gmail) — folosit pentru: confirmare cerere rezervare, aprobare, respingere, anulare, resetare parolă.
- **Notificări push**: se folosesc automat prin `expo-server-sdk`, fără configurare suplimentară — funcționează doar pe dispozitive fizice (nu în simulator), după ce utilizatorul acordă permisiunea de notificări.

---


## Limitări cunoscute


- Rezervările efectuate ca **oaspete** (guest) nu au istoric asociat unui cont (nu există `user_id` real).
- Asistentul AI local (Ollama, `llama3.2:3b`) necesită resurse hardware suficiente pe calculatorul pe care rulează backend-ul; pe mașini mai slabe, timpul de răspuns poate fi mare la primul mesaj.

---

## Autor

**[Catană Nicoleta-Cristina]**
Lucrare de licență — Universitatea Politehnica Timișoara, Facultatea de Automatică și Calculatoare
Anul universitar: 2026
