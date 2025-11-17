# HenVenn - Ortopedisk Henvisningstriagering

En webapplikasjon for å hjelpe ortopeder på sykehus å triagere henvisninger fra fastleger etter inntaksfrist ved hjelp av AI.

## ✨ Funksjonalitet

- **📄 PDF-parsing**: Last opp PDF-filer med henvisninger - applikasjonen ekstraher automatisk tekst
- **🤖 AI-assistert triagering**: Claude eller GPT-4 analyserer hver henvisning og gir strukturert vurdering
- **🎯 Automatisk kategorisering**: Henvisninger grupperes etter hastegrad basert på Helsedirektoratets prioriteringsveileder:
  - 🔴 **Rød**: Inntaksfrist ≤ 4 uker (akutte tilstander)
  - 🟠 **Oransje**: Inntaksfrist 5-12 uker (betydelige symptomer)
  - 🟢 **Grønn**: Inntaksfrist > 12 uker (elektive tilstander)
  - ⚪ **Vurderes avvist**: Kan håndteres i primærhelsetjenesten
- **📊 Eksport-funksjonalitet**: Eksporter triageringsoversikt til JSON, CSV eller detaljert rapport
- **💬 Chatbot-assistanse**: Still spørsmål om AI-vurderingene
- **🔄 Sanntids-prosessering**: Se fremdrift mens AI vurderer henvisninger

## 📐 Design

Applikasjonen har et todelt layout for optimal arbeidsflyt:

### Venstre panel:
- **Eksport-knapper**: Eksporter resultater til forskjellige formater
- **Triageringsgrupper** med fargekodede indikatorer
- **Nedtrekksmenyer** for hver henvisning som viser:
  - Nøkkeloppsummering av symptomer
  - Tentativ diagnose
  - Differensialdiagnoser
  - Anbefalt inntaksfrist (basert på prioriteringsveilederen)
  - Avvisningsårsak (hvis aktuelt)

### Høyre panel:
- **PDF-opplastning** øverst
- **Fullstendig henvisningstekst** fra opplastet PDF
- **Stasjonær chatbot** nederst for spørsmål

## 🚀 Kom i gang

### Forutsetninger

- Node.js 18+ installert
- En API-nøkkel fra enten:
  - [Anthropic Claude](https://console.anthropic.com/) (anbefalt)
  - [OpenAI](https://platform.openai.com/api-keys) (alternativ)

### Installasjon

1. **Klon repositoriet:**
```bash
git clone <repository-url>
cd HenVenn
```

2. **Installer avhengigheter:**
```bash
npm install
```

3. **Konfigurer AI API-nøkkel:**

Opprett en `.env` fil i root-mappen:
```bash
cp .env.example .env
```

Rediger `.env` og legg til din API-nøkkel:
```env
# For Claude (anbefalt)
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ELLER for OpenAI
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Viktig:** `.env` filen er i `.gitignore` og vil ikke bli committed til git. **Del aldri API-nøkler offentlig!**

### Kjøring

Start utviklingsserveren:
```bash
npm run dev
```

Åpne nettleseren på: `http://localhost:5173`

## 🤖 AI-konfigurasjon

### Valg av AI-modell

Applikasjonen støtter to AI-leverandører:

| Leverandør | Modell | Fordeler | Kostnad (ca) |
|------------|--------|----------|-------------|
| **Anthropic Claude** | Claude 3.5 Sonnet | Beste medisinsk resonnering, lang kontekst (200k tokens), nøyaktig strukturert output | $3/$15 per 1M tokens |
| **OpenAI** | GPT-4 Turbo | Velkjent, god dokumentasjon, bred tilgjengelighet | $5/$15 per 1M tokens |

**Anbefaling:** **Claude 3.5 Sonnet** gir best resultater for medisinske vurderinger og kompleks resonnering.

### Hvordan det fungerer

1. **Last opp PDF**: Bruker PDF.js til å ekstrahere tekst fra henvisninger
2. **Tekstprosessering**: Splitter PDF i separate henvisninger
3. **AI-analyse**: For hver henvisning:
   - Ekstraerer pasientinformasjon
   - Identifiserer symptomer og røde flagg
   - Gir tentativ diagnose med differensialdiagnoser
   - Matcher mot prioriteringsveilederen
   - Anbefaler inntaksfrist eller avvisning
4. **Presentasjon**: Viser strukturert triagering i brukergrensesnittet

### Uten AI-nøkkel

Hvis ingen API-nøkkel er konfigurert, kan du fortsatt teste applikasjonen med mock-data. Ved første PDF-opplastning får du valget om å bruke testdata.

## 📤 Eksport-funksjoner

Applikasjonen tilbyr tre eksportformater:

### 1. JSON-eksport
Strukturert data for videre behandling eller integrasjon:
```json
[
  {
    "id": "ref-1",
    "referralNumber": 1,
    "patientInfo": {...},
    "assessment": {...}
  }
]
```

### 2. CSV-eksport
Regnearkformat for analyse i Excel/Google Sheets:
```csv
Henvisningsnummer,Pasientnavn,Alder,Prioritetsgruppe,Diagnose,...
1,Ola Nordmann,45,Rød (≤4 uker),MCL-ruptur,...
```

### 3. Tekstrapport
Lesbar rapport med alle detaljer for utskrift eller journalføring.

## 🏗️ Teknisk arkitektur

### Frontend
- **React 18** med TypeScript
- **Vite** som byggverktøy
- **CSS Modules** for styling
- **PDF.js** for PDF-parsing

### AI-integrasjon
- **Anthropic SDK** for Claude
- **OpenAI SDK** for GPT-4
- Fleksibel arkitektur som støtter begge leverandører

### Services
```
src/services/
├── pdfParser.ts              # PDF tekstekstraksjon
├── aiService.ts              # AI-integrasjon (Claude/OpenAI)
├── referralProcessor.ts      # Hovedprosesseringslogikk
├── priorityGuidelinesService.ts  # Prioriteringsveileder
└── exportService.ts          # Eksportfunksjonalitet
```

## 🎨 Fargepalett

- **Bakgrunn**: Lyseblå (#E6F3FF)
- **Logo**: Mørkeblå (#003d7a)
- **Chatbot-bokser**: Hvit (#FFFFFF)
- **Nedtrekksmenyer**: Grå (#d3d3d3)
- **Prioritetsgrupper**:
  - Rød: #e74c3c
  - Oransje: #e67e22
  - Grønn: #27ae60
  - Avvist: #7f8c8d

## 🏥 Prioriteringsveileder

Applikasjonen bruker Helsedirektoratets prioriteringsveileder for ortopedi som grunnlag for triagering. Veilederen er implementert i koden med følgende kriterier:

- **Inntaksfrist**: Basert på tilstandens alvorlighetsgrad
- **Røde flagg**: Nevrologiske utfall, progredierende symptomer, etc.
- **Prioriteringskriterier**: Funksjonsnedsettelse, smertenivå, respons på behandling

## 🔒 Sikkerhet og personvern

⚠️ **VIKTIG**: Denne applikasjonen er en **prototype** og skal **IKKE** brukes med reelle pasientdata i produksjon uten:

1. **Backend-server**: API-kall bør gå via sikker backend, ikke direkte fra nettleser
2. **Kryptering**: All pasientdata må krypteres i transit og ved lagring
3. **Tilgangskontroll**: Implementer autentisering og autorisasjon
4. **GDPR-compliance**: Sørg for samtykke og databehandleravtaler
5. **Logging og revisjon**: Logg all tilgang til pasientdata
6. **Helsedatalov**: Følg norske regler for behandling av helseopplysninger

**For produksjonsbruk:**
- Fjern `dangerouslyAllowBrowser: true` fra AI-konfigurasjonen
- Implementer server-side API-proxy
- Bruk sikker autentisering (f.eks. HelseID)
- Lagre data i godkjent helsejournal-system

## 🐛 Feilsøking

### PDF kan ikke leses
- Sjekk at det er en gyldig PDF-fil
- Noen krypterte PDFer kan ikke leses
- Prøv å eksportere PDF på nytt fra kildesystemet

### AI gir ikke gode vurderinger
- Sjekk at API-nøkkelen er korrekt konfigurert
- Claude 3.5 Sonnet anbefales for best resultat
- Verifiser at prioriteringsveilederen er oppdatert

### Opplasting feiler
- Sjekk nettverksforbindelse
- Se i nettleserens konsoll (F12) for feilmeldinger
- Verifiser at API-nøkkelen har tilstrekkelig kreditt

## 📝 Kommende funksjoner

- [ ] Server-side API for sikker håndtering av API-nøkler
- [ ] Brukerautentisering med HelseID
- [ ] Lagring av triageringer i database
- [ ] Historikk og søk i tidligere triageringer
- [ ] Mulighet for å redigere AI-vurderinger manuelt
- [ ] Integrasjon med EPJ-systemer
- [ ] Support for flere medisinske spesialiteter
- [ ] Statistikk og rapportering over tid

## 📚 Dokumentasjon

### For utviklere
- Se `src/services/` for dokumentasjon av tjenester
- Alle komponenter er TypeScript med type-definisjoner
- CSS-filer følger BEM-metodikk

### For brukere
- Last opp PDF med henvisningstekster
- Vent mens AI prosesserer (ca. 10-30 sek per henvisning)
- Se triageringsresultater på venstre side
- Klikk på henvisning for å se full tekst og vurdering
- Eksporter resultater med knappene øverst til venstre

## 🤝 Bidra

Dette er et prototype-prosjekt. For å bidra:

1. Fork repositoriet
2. Opprett en feature branch
3. Commit endringene dine
4. Push til branchen
5. Opprett en Pull Request

## 📄 Lisens

[Lisens TBD]

## 📧 Kontakt

For spørsmål eller tilbakemeldinger, opprett en issue i GitHub-repositoriet.

---

**Disclaimer:** Denne applikasjonen er en prototype for testing og utvikling. Den skal ikke brukes for faktisk medisinsk triagering eller med reelle pasientdata uten nødvendige sikkerhetstiltak og godkjenninger.
