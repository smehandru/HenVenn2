import { Referral } from './types'

export const mockReferrals: Referral[] = [
  {
    id: '1',
    referralNumber: 1,
    patientInfo: {
      name: 'Ola Nordmann',
      age: 45,
      gender: 'Mann'
    },
    symptoms: ['Akutt smerte i kneet', 'Kraftig hevelse', 'Kan ikke belaste'],
    duration: '2 dager',
    redFlags: ['Akutt debut', 'Uttalt hevelse', 'Betydelig funksjonsnedsettelse'],
    fullText: `Pasient: Ola Nordmann, 45 år

Henvisningsgrunn:
Pasienten kommer til konsultasjon etter akutt debut av kraftig smerte i høyre kne for 2 dager siden.
Oppstod under fotballkamp hvor han fikk et kraftig slag mot kneet fra siden.

Sykehistorie:
Tidligere frisk, ingen kjente leddsykdommer. Ingen tidligere kneskader.

Klinisk funn:
- Kraftig hevelse i høyre kne
- Betydelig ømhet over medialt kollateralligament
- Positiv valgus-stress test
- Kraftig smerte ved bevegelse
- Ikke i stand til å belaste

Røntgen av kne viser ingen fraktur.

Vurdering:
Mistenkt ruptur av medialt kollateralligament. Trenger akutt ortopedisk vurdering og eventuell MR.

Ønsker rask tilbakemelding grunnet betydelig funksjonsnedsettelse.

Med vennlig hilsen,
Dr. Hansen`,
    assessment: {
      keySummary: 'Akutt knetraume med kraftig hevelse og funksjonsnedsettelse. Positiv valgus-stress test tyder på ligamentskade.',
      tentativeDiagnosis: 'Ruptur av medialt kollateralligament (MCL)',
      differentialDiagnoses: [
        'Meniskruptur',
        'Kombinert ligamentskade (MCL + korsbånd)',
        'Leddbruskkade'
      ],
      guidelineDescription: {
        conditions: [{
          icon: '🦵',
          name: 'Akutt ligamentskade i kne',
          source: 'Kap. 2.15 Akutte traumatiske skader',
          deadlines: ['Veiledende frist: 2 uker'],
          rightToHealthcare: true,
          comment: 'Akutte ligamentskader med betydelig funksjonsnedsettelse krever tidlig MR-diagnostikk og behandlingsplanlegging for å unngå komplikasjoner.'
        }]
      },
      priorityGroup: 'red'
    }
  },
  {
    id: '2',
    referralNumber: 2,
    patientInfo: {
      name: 'Kari Jensen',
      age: 62,
      gender: 'Kvinne'
    },
    symptoms: ['Kroniske skuldersmerter', 'Nattsmerter', 'Bevegelsesreduksjon'],
    duration: '8 måneder',
    redFlags: ['Nattsmerter', 'Betydelig bevegelsesreduksjon'],
    fullText: `Pasient: Kari Jensen, 62 år

Henvisningsgrunn:
Pasienten har hatt progressive skuldersmerter i 8 måneder. Plagene er nå betydelig forverret
med uttalt nattsmerte som forstyrrer søvnen.

Sykehistorie:
Ingen tidligere skulderskader. Diabetes type 2. Ikke-røyker.

Klinisk funn:
- Betydelig redusert aktiv og passiv bevegelighet i høyre skulder
- Positiv impingement-test
- Smerter ved abduksjon over 90 grader
- Nattsmerter som vekker pasienten

Røntgen skulder viser moderate degenerative forandringer i AC-leddet og noe redusert akromio-humeral avstand.

Vurdering:
Rotatorcuff-syndrom med mistenkt delruptur. Har ikke respondert på fysioterapi og antiinflammatorisk behandling over 4 måneder.

Ber om ortopedisk vurdering for videre utredning med MR og evt. operativ behandling.

Med vennlig hilsen,
Dr. Olsen`,
    assessment: {
      keySummary: 'Kroniske skuldersmerter med nattsmerter og bevegelsesreduksjon. Ikke respondert på konservativ behandling.',
      tentativeDiagnosis: 'Rotatorcuff-syndrom med mistenkt delruptur',
      differentialDiagnoses: [
        'Frozen shoulder (adhesiv kapsulitt)',
        'Fullstendig rotatorcuff-ruptur',
        'Subakromialt impingement'
      ],
      guidelineDescription: {
        conditions: [{
          icon: '🦵',
          name: 'Rotatorcuff-ruptur (skulder)',
          source: 'Kap. 2.22 Rotatorcuff skade',
          deadlines: ['Degenerativ ruptur: Veiledende frist 26 uker', 'Med betydelige symptomer: 8-12 uker'],
          rightToHealthcare: true,
          comment: 'Ikke respondert på konservativ behandling. Nattsmerter og funksjonsnedsettelse indikerer behov for raskere vurdering enn standard degenerativ ruptur.'
        }]
      },
      priorityGroup: 'orange'
    }
  },
  {
    id: '3',
    referralNumber: 3,
    patientInfo: {
      name: 'Per Svendsen',
      age: 58,
      gender: 'Mann'
    },
    symptoms: ['Hoftesmerter', 'Nedsatt gangfunksjon', 'Morgenstivhet'],
    duration: '2 år',
    redFlags: [],
    fullText: `Pasient: Per Svendsen, 58 år

Henvisningsgrunn:
Langvarige hoftesmerter som har progrediért over 2 år. Pasienten opplever nå betydelig redusert livskvalitet.

Sykehistorie:
Kjent med lett hofteartrose diagnostisert for 3 år siden. Overvektig (BMI 32).

Klinisk funn:
- Redusert bevegelighet i begge hofter, spesielt rotasjon
- Positiv FABER-test bilateralt
- Haltende gange
- Moderat morgenstivhet (ca 30 min)
- Smerter ved lengre gåturer (>1 km)

Røntgen bekker viser moderat til uttalt artrose i begge hofter med redusert leddspaltehøyde og subkondral sklerose.

Vurdering:
Bilateral hofteartrose som ikke lenger responderer tilfredsstillende på konservativ behandling.
Vektreduksjon anbefalt men vanskelig å gjennomføre.

Henviser for vurdering av hofteprotese.

Med vennlig hilsen,
Dr. Berg`,
    assessment: {
      keySummary: 'Bilateral hofteartrose med betydelig symptombyrde og funksjonsnedsettelse over lengre tid.',
      tentativeDiagnosis: 'Bilateral coxartrose',
      differentialDiagnoses: [
        'Trokantær bursitt',
        'Labrum-skade',
        'Lumbal radikulopati'
      ],
      guidelineDescription: {
        conditions: [{
          icon: '🦴',
          name: 'Hofteleddsartrose',
          source: 'Kap. 2.13 Artrose (hofteledd)',
          deadlines: ['Elektive tilfeller: Veiledende frist 26 uker'],
          rightToHealthcare: true,
          comment: 'Bilateral coxartrose med stabil symptomatikk. Elektiv vurdering for hofteprotese basert på funksjonsnivå og livskvalitet.'
        }]
      },
      priorityGroup: 'green'
    }
  },
  {
    id: '4',
    referralNumber: 4,
    patientInfo: {
      name: 'Anne Larsen',
      age: 35,
      gender: 'Kvinne'
    },
    symptoms: ['Lett knesmerter', 'Sporadisk hevelse'],
    duration: '3 måneder',
    redFlags: [],
    fullText: `Pasient: Anne Larsen, 35 år

Henvisningsgrunn:
Pasienten har hatt lette knesmerter i ca 3 måneder.

Sykehistorie:
Ellers frisk. Driver med trim og jogging.

Klinisk funn:
- Lett ømhet over medialt leddspalte
- Sporadisk minimal hevelse
- Full bevegelighet
- Normal gangfunksjon
- Negative menisk-tester
- Negative ligament-tester

Røntgen kne uten funn.

Vurdering:
Uspesifikke knesmerter. Ingen objektive funn av betydning.

Henviser for ortopedisk vurdering.

Med vennlig hilsen,
Dr. Nilsen`,
    assessment: {
      keySummary: 'Uspesifikke knesmerter uten objektive funn. Full bevegelighet og funksjon.',
      tentativeDiagnosis: 'Uspesifikke knesmerter',
      differentialDiagnoses: [
        'Overbelastningssyndrom',
        'Mild meniskskade',
        'Plica-syndrom'
      ],
      priorityGroup: 'rejected',
      rejection: {
        missingInformation: [
          'Mangler beskrivelse av forsøkt konservativ behandling',
          'Ingen dokumentasjon på fysioterapibehandling',
          'Mangler beskrivelse av funksjonsnivå og aktivitetsbegrensning'
        ],
        expectedPrimaryCareActions: [
          'Fysioterapi med fokus på styrketrening av quadriceps og baklår i 8-12 uker',
          'Treningsopptrapping med gradvis økning av belastning',
          'Prøv NSAID-behandling ved behov for smertelindring',
          'Ny vurdering hos fastlege dersom symptomene vedvarer eller forverres etter 3 måneder'
        ]
      }
    }
  },
  {
    id: '5',
    referralNumber: 5,
    patientInfo: {
      name: 'Erik Johansen',
      age: 28,
      gender: 'Mann'
    },
    symptoms: ['Ankelsmerte', 'Ustabilitet'],
    duration: '6 uker',
    redFlags: [],
    fullText: `Pasient: Erik Johansen, 28 år

Henvisningsgrunn:
Ankelskade for 6 uker siden.

Sykehistorie:
Vridde om på ankelen under fotballkamp.

Klinisk funn:
- Lett ømhet lateralt på ankelen
- God bevegelighet
- Kan gå normalt
- Lettere testing

Ingen røntgen tatt.

Vurdering:
Mulig ankelskade.

Henviser til ortoped.

Med vennlig hilsen,
Dr. Andersen`,
    assessment: {
      keySummary: 'Ankelskade for 6 uker siden med minimal symptomatikk. Ingen bildediagnostikk utført.',
      tentativeDiagnosis: 'Tidligere ankel-distorsjon (sannsynligvis i god bedring)',
      differentialDiagnoses: [
        'Lateral ligamentskade',
        'Kronisk ankelinstabilitet'
      ],
      priorityGroup: 'rejected',
      rejection: {
        missingInformation: [
          'Mangler røntgen av ankel (bør vært tatt ved initial skade)',
          'Ingen beskrivelse av behandlingsforsøk som er gjort',
          'Mangler informasjon om funksjonsnivå og aktivitetsbegrensning',
          'Ingen dokumentasjon på fysioterapibehandling'
        ],
        expectedPrimaryCareActions: [
          'Ta røntgen av ankel for å utelukke benskade',
          'Start fysioterapi med fokus på proprioseptiv trening og styrking i minimum 6-8 uker',
          'Vurder bruk av ankelstøtte/orthose ved aktivitet',
          'Ny vurdering hos fastlege etter 8 uker hvis vedvarende instabilitet eller smerter'
        ]
      }
    }
  },
  {
    id: '6',
    referralNumber: 6,
    patientInfo: {
      name: 'Lise Pedersen',
      age: 52,
      gender: 'Kvinne'
    },
    symptoms: ['Kraftige nakkesmerter', 'Utstrålende smerter til arm', 'Nummenhet i fingre'],
    duration: '4 uker',
    redFlags: ['Nevrologiske utfall', 'Utstrålende smerter'],
    fullText: `Pasient: Lise Pedersen, 52 år

Henvisningsgrunn:
Akutt forverring av nakkesmerter med utstrålende smerter til høyre arm og hånd.

Sykehistorie:
Langvarige periodiske nakkeplager. Arbeider som frisør. Røyker ikke.

Klinisk funn:
- Kraftige nakkesmerter med bevegelsesreduksjon
- Positiv Spurling's test høyre side
- Utstrålende smerter til tommel, peke- og langfinger høyre hånd
- Redusert følelse i C6-dermatom
- Nedsatt kraft ved håndleddsekstensjon høyre
- Positiv reflekshammer C6

MR columna cervicalis viser betydelig diskusprolaps C5-C6 med nerverotkompresjon.

Vurdering:
C6-radikulopati som følge av diskusprolaps. Progredierte nevrologiske utfall.

Trenger akutt vurdering for evt. kirurgisk dekompresjon.

Med vennlig hilsen,
Dr. Bakke`,
    assessment: {
      keySummary: 'Akutt cervikal radikulopati med progressive nevrologiske utfall. MR viser betydelig diskusprolaps med nerverotkompresjon.',
      tentativeDiagnosis: 'C6-radikulopati pga. diskusprolaps C5-C6',
      differentialDiagnoses: [
        'Cervical myelopati',
        'Thoracic outlet syndrome',
        'Perifer nerveskade (n. radialis)'
      ],
      guidelineDescription: {
        conditions: [{
          icon: '🦴',
          name: 'Cervikal radikulopati med nevrologiske utfall',
          source: 'Kap. 2.8 Cervikal radikulopati',
          deadlines: ['Veiledende frist: 2 uker ved progressive nevrologiske utfall'],
          rightToHealthcare: true,
          comment: 'Progressive nevrologiske utfall med parese og nummenhet. MR viser betydelig diskusprolaps med nerverotkompresjon. Raskt behov for vurdering av kirurgisk dekompresjon for å forhindre permanent nerveskade.'
        }]
      },
      priorityGroup: 'red'
    }
  },
  {
    id: '7',
    referralNumber: 7,
    patientInfo: {
      name: 'Tom Hansen',
      age: 41,
      gender: 'Mann'
    },
    symptoms: ['Albuesmerter', 'Svakhet i hånd'],
    duration: '5 måneder',
    redFlags: [],
    fullText: `Pasient: Tom Hansen, 41 år

Henvisningsgrunn:
Persisterende albuesmerter og svakhet i hånden.

Sykehistorie:
Arbeider som snekker. Har hatt periodiske albueplager tidligere.

Klinisk funn:
- Ømhet over lateral epikondyl
- Smerte ved håndleddsekstensjon mot motstand
- Lett redusert grepsstyrke
- Normal bevegelighet i albue

Røntgen albue uten funn.

Vurdering:
Lateral epikondylitt (tennisalbue). Har fått behandling med fysioterapi i 2 måneder uten særlig effekt.

Henviser for ortopedisk vurdering og evt. infiltrasjon.

Med vennlig hilsen,
Dr. Lund`,
    assessment: {
      keySummary: 'Kronisk lateral epikondylitt uten respons på fysioterapi. Arbeidsrelatert belastning.',
      tentativeDiagnosis: 'Lateral epikondylitt (tennisalbue)',
      differentialDiagnoses: [
        'Radialtunnel-syndrom',
        'Lateral ligamentskade',
        'Osteoartritt i albue'
      ],
      guidelineDescription: {
        conditions: [{
          icon: '🦵',
          name: 'Lateral epikondylitt (tennisalbue)',
          source: 'Kap. 2.25 Kroniske seneskader',
          deadlines: ['Veiledende frist: 8-12 uker ved manglende respons på konservativ behandling'],
          rightToHealthcare: true,
          comment: 'Kronisk lateral epikondylitt med manglende respons på 2 måneders fysioterapi. Arbeidsrelatert belastning indikerer behov for vurdering av infiltrasjon (kortison/PRP) eller eventuelt kirurgisk behandling.'
        }]
      },
      priorityGroup: 'orange'
    }
  }
]
