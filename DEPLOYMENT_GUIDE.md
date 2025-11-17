# 🚀 HenVenn Deployment Guide til Railway.com

Dette er en **steg-for-steg guide for nybegynnere** som skal deploye HenVenn til Railway.com.

---

## 📋 Hva du trenger før du starter

1. ✅ En Railway.com konto (du har dette allerede!)
2. ✅ En GitHub konto
3. ✅ OpenAI API-nøkkel (eller Claude API-nøkkel)
4. ✅ OpenAI Assistant ID (hvis du bruker OpenAI Assistant)

---

## 🔧 Fase 1: Push koden til GitHub

### Steg 1.1: Sjekk at alt er committed

Åpne terminal i HenVenn-mappen og kjør:

```bash
git status
```

Hvis det viser endringer som ikke er committed, kjør:

```bash
git add -A
git commit -m "Ready for deployment"
git push
```

### Steg 1.2: Finn GitHub repository URL

Din GitHub repository URL er sannsynligvis:
```
https://github.com/smehandru/HenVenn
```

---

## 🚂 Fase 2: Deploy til Railway.com

### Steg 2.1: Logg inn på Railway

1. Gå til https://railway.com
2. Klikk "Login" (øverst til høyre)
3. Logg inn med GitHub-kontoen din

### Steg 2.2: Opprett nytt prosjekt

1. Klikk på **"New Project"** (stor blå knapp)
2. Velg **"Deploy from GitHub repo"**
3. Hvis du blir spurt om tilgang til GitHub:
   - Klikk "Configure GitHub App"
   - Velg "Only select repositories"
   - Velg **"HenVenn"**
   - Klikk "Install & Authorize"

### Steg 2.3: Velg HenVenn repository

1. Railway vil nå vise listen over dine repositories
2. Finn **"HenVenn"** i listen
3. Klikk på den

### Steg 2.4: Konfigurer deployment

Railway vil automatisk:
- ✅ Oppdage at dette er en Node.js app
- ✅ Installere alle pakker (`npm install`)
- ✅ Bygge prosjektet (`npm run build`)
- ✅ Starte serveren (`npm start`)

---

## 🔐 Fase 3: Legg til Environment Variables (API-nøkler)

**VIKTIG**: Dette er hvor du legger inn API-nøklene dine på en sikker måte!

### Steg 3.1: Åpne Variables-fanen

1. I Railway-prosjektet ditt, klikk på **"Variables"**-fanen (til venstre)
2. Du ser nå en liste over environment variables

### Steg 3.2: Legg til dine API-nøkler

Klikk **"+ New Variable"** og legg til HVER av disse (en av gangen):

#### For OpenAI Assistant (ANBEFALT):

```
Variable: VITE_OPENAI_API_KEY
Value: [din OpenAI API-nøkkel som starter med sk-proj-...]
```

```
Variable: VITE_OPENAI_ASSISTANT_ID
Value: [din Assistant ID som starter med asst_...]
```

#### ELLER for Claude:

```
Variable: VITE_ANTHROPIC_API_KEY
Value: [din Claude API-nøkkel som starter med sk-ant-...]
```

### Steg 3.3: Legg til PORT variable

```
Variable: PORT
Value: 3001
```

### Steg 3.4: Apply changes

Klikk **"Deploy"** eller vent noen sekunder - Railway vil automatisk re-deploye med de nye variablene.

---

## 🌐 Fase 4: Få din website URL

### Steg 4.1: Generer offentlig URL

1. I Railway-prosjektet, gå til **"Settings"**-fanen
2. Scroll ned til **"Networking"**
3. Under **"Public Networking"**, klikk **"Generate Domain"**
4. Railway vil gi deg en URL som ser slik ut:
   ```
   https://henvenn-production.up.railway.app
   ```
5. **KOPIER DENNE URLEN** - dette er din nye website!

---

## ✅ Fase 5: Test at alt fungerer

### Steg 5.1: Åpne websiten

1. Klikk på URLen Railway ga deg
2. Du skal nå se HenVenn-appen i nettleseren!

### Steg 5.2: Test funksjonalitet

1. ✅ **Se at logoen vises** øverst
2. ✅ **Last opp en PDF eller Word-fil** med henvisninger
3. ✅ **Vent på at AI prosesserer** (kan ta 10-30 sekunder)
4. ✅ **Se at henvisninger vises** i triagegruppene (rød/oransje/grønn)
5. ✅ **Klikk på en henvisning** for å se detaljer
6. ✅ **Klikk "💬 Spør Henvenn"** og test chatbot
7. ✅ **Test ressurs-knappene** (Metodebok og Prioriteringsveileder)

### Steg 5.3: Sjekk server logs (hvis noe ikke fungerer)

1. I Railway, gå til **"Deployments"**-fanen
2. Klikk på den siste deploymenten
3. Klikk **"View Logs"**
4. Her kan du se hva som skjer - nyttig for debugging!

---

## 🔄 Fase 6: Oppdatere websiten senere

Hver gang du pusher endringer til GitHub, vil Railway **automatisk** re-deploye!

```bash
# I HenVenn-mappen:
git add -A
git commit -m "Beskrivelse av endringer"
git push
```

Railway oppdager pushen og deployer automatisk (tar 2-5 minutter).

---

## 🐛 Vanlige problemer og løsninger

### Problem: "API-vurdering ikke tilgjengelig"

**Årsak**: API-nøklene er ikke riktig konfigurert.

**Løsning**:
1. Gå til Railway → **"Variables"**
2. Sjekk at `VITE_OPENAI_API_KEY` og `VITE_OPENAI_ASSISTANT_ID` er riktig
3. Sørg for at nøklene ikke har mellomrom før/etter
4. Klikk **"Deploy"** for å re-deploye

### Problem: "Could not fetch"

**Årsak**: Serveren er ikke startet riktig.

**Løsning**:
1. Gå til Railway → **"Deployments"** → **"View Logs"**
2. Se etter feilmeldinger
3. Sørg for at `npm start` kjører riktig

### Problem: "Page not found" / 404

**Årsak**: Public domain er ikke generert.

**Løsning**:
1. Gå til Railway → **"Settings"** → **"Networking"**
2. Klikk **"Generate Domain"**
3. Vent 1-2 minutter og prøv igjen

### Problem: OCR fungerer ikke (skannede PDF-er)

**Årsak**: OpenAI Vision krever gpt-4o modell.

**Løsning**:
- Sørg for at du har OpenAI API-nøkkel (ikke bare Assistant)
- OCR bruker OpenAI Vision API automatisk

---

## 💰 Kostnader på Railway

- **Hobby Plan** (gratis): $5 gratis kreditt per måned
- **Typisk bruk**: ~$3-10 per måned avhengig av trafikk
- API-kostnader (OpenAI/Claude) kommer i tillegg

**Tips for å spare penger**:
- Railway sleep mode: Inaktive apps sover etter 30 min
- OpenAI Assistant: Billigere enn mange API-kall
- Claude: Ofte billigere enn OpenAI for chat

---

## 📞 Trenger du mer hjelp?

- **Railway dokumentasjon**: https://docs.railway.com
- **Railway Discord**: https://discord.gg/railway
- **OpenAI dokumentasjon**: https://platform.openai.com/docs

---

## 🎉 Gratulerer!

Din HenVenn-app er nå live på internett! 🚀

Del lenken med kolleger:
```
https://din-henvenn-app.up.railway.app
```

**Viktig sikkerhetsmerknad**:
- ✅ API-nøkler er nå sikret på server-siden
- ✅ Kun backend-serveren har tilgang til nøklene
- ✅ Nøklene vises IKKE i nettleser-koden

God triagering! 🏥💙
