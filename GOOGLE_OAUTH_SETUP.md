# Google OAuth Setup Guide

## 1. Skapa Google Cloud Project

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa nytt projekt eller välj ett befintligt
3. Gå till **APIs & Services** → **OAuth consent screen**
4. Välj "External" och konfigurera grundinställningar

## 2. Skapa OAuth Credentials

1. Gå till **APIs & Services** → **Credentials**
2. Klicka **Create Credentials** → **OAuth client ID**
3. Välj **Web application**
4. Lägg till:

   **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `https://leads.techchange.io`

   **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
   - `https://leads.techchange.io/api/auth/callback/google`

5. Kopiera **Client ID** och **Client Secret**

## 3. Generera AUTH_SECRET

```bash
openssl rand -base64 32
```

## 4. Konfigurera miljövariabler

### Lokalt (.env.local)

```env
AUTH_SECRET="din-genererade-nyckel"
GOOGLE_CLIENT_ID="din-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="din-client-secret"
```

### Vercel (Production)

1. Gå till Vercel → ditt projekt → Settings → Environment Variables
2. Lägg till:
   - `AUTH_SECRET` = (ny slumpmässig nyckel)
   - `GOOGLE_CLIENT_ID` = (samma som lokalt)
   - `GOOGLE_CLIENT_SECRET` = (samma som lokalt)

## 5. Begränsa till specifika användare (rekommenderas!)

Redigera `lib/auth.ts` och avkommentera email-kontrollen:

```typescript
async signIn({ user }) {
  const allowedEmails = ['micky@techchange.io']
  if (!allowedEmails.includes(user.email || '')) {
    return false
  }
  return true
}
```

## Felsökning

- **"redirect_uri_mismatch"** → Kontrollera att redirect URI:n matchar exakt (inkl. https/http)
- **"access_denied"** → Kontrollera OAuth consent screen och att din email är tillagd som testanvändare
- **"invalid_client"** → Kontrollera Client ID och Secret

## Snabbstart

```bash
# 1. Kopiera env-filen
cp .env.example .env.local

# 2. Fyll i värdena
nano .env.local

# 3. Starta om servern
npm run dev
```

Besök http://localhost:3000 → du ska nu se login-sidan!
