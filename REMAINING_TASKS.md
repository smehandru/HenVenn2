# Gjenværende oppgaver for HenVenn UI-forbedringer

## ✅ Fullført:
1. Flyttet opplastingsknapp til ResourceLinks-komponenten

## 📋 Gjenværende oppgaver:

### 1. Oppdater ResourceLinks.css
- Gjør upload-button-primary større og mer fremtredende
- Style alle knapper på samme linje
- Mindre styling på metodebok og veileder-knappene

### 2. Oppdater RightPanel.tsx  
- Fjern FileUpload-komponenten
- Send onFileUpload og isProcessing til ResourceLinks
- Legg til sentrert instruksjonstekst når ingen fil er lastet opp

### 3. Legg til tittel på venstre panel
- "Henvisningstriagering" over TriageGroups
- Mindre font enn "HenVenn"

### 4. Ny laptop-logo
- Bytt eksisterende logo med laptop som viser humerus på skjermen
- Moderne og minimalistisk design

### 5. Instruksjonstekst på venstre side
- Vis kun når ingen fil er lastet opp
- Sentralt under grupperingene
- "Henvisninger skal her triageres etter anbefalt inntaksfrist"
- "Trykk på nedtrekksmenyene for å se anbefalingene"

### 6. Undertittel i Header
- "- Klinisk beslutningsstøtte for henvisningsarbeid"
- Under "HenVenn" tittelen
- Mindre font

### 7. Streaming chat-respons
- Implementer SSE (Server-Sent Events) eller streaming
- Vis ord-for-ord som ChatGPT
- Krever backend-endringer

### 8. Forbedre chat-formatering
- Paragrafer for punktlister
- Hevet tittel for punkter (f.eks. "**1. Rolig forflytning:**")
- Automatisk formatering av AI-svar

