import { Referral } from '../types'

/**
 * Export Service
 * Handles exporting triage results to various formats
 */

/**
 * Export referrals to JSON format
 */
export function exportToJSON(referrals: Referral[]): void {
  const dataStr = JSON.stringify(referrals, null, 2)
  downloadFile(dataStr, 'henvenn-triagering.json', 'application/json')
}

/**
 * Export referrals to CSV format
 */
export function exportToCSV(referrals: Referral[]): void {
  const headers = [
    'Henvisningsnummer',
    'Pasientnavn',
    'Alder',
    'Kjønn',
    'Prioritetsgruppe',
    'Tentativ diagnose',
    'Anbefalt inntaksfrist',
    'Nøkkeloppsummering',
    'Differensialdiagnoser'
  ]

  const rows = referrals.map(ref => {
    // Extract deadlines from guidelineDescription if available
    let deadlineText = ''
    if (ref.assessment?.guidelineDescription?.conditions && ref.assessment.guidelineDescription.conditions.length > 0) {
      deadlineText = ref.assessment.guidelineDescription.conditions[0].deadlines.join('; ')
    }

    return [
      ref.referralNumber.toString(),
      ref.patientInfo.name,
      ref.patientInfo.age.toString(),
      ref.patientInfo.gender,
      getPriorityGroupText(ref.assessment?.priorityGroup || 'green'),
      ref.assessment?.tentativeDiagnosis || '',
      deadlineText,
      `"${ref.assessment?.keySummary || ''}"`,
      `"${ref.assessment?.differentialDiagnoses?.join(', ') || ''}"`
    ]
  })

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

  downloadFile(csvContent, 'henvenn-triagering.csv', 'text/csv;charset=utf-8;')
}

/**
 * Export referrals summary report
 */
export function exportSummaryReport(referrals: Referral[]): void {
  const summary = generateSummaryReport(referrals)
  downloadFile(summary, 'henvenn-rapport.txt', 'text/plain')
}

/**
 * Generate a text summary report
 */
function generateSummaryReport(referrals: Referral[]): string {
  const stats = calculateStatistics(referrals)

  let report = '═══════════════════════════════════════════════════\n'
  report += '           HENVENN TRIAGERINGSRAPPORT\n'
  report += '═══════════════════════════════════════════════════\n\n'

  report += `Dato: ${new Date().toLocaleDateString('nb-NO')}\n`
  report += `Totalt antall henvisninger: ${referrals.length}\n\n`

  report += '─────────────────────────────────────────────────\n'
  report += 'PRIORITERINGSFORDELING\n'
  report += '─────────────────────────────────────────────────\n'
  report += `🔴 Rød (≤4 uker):        ${stats.red} henvisninger\n`
  report += `🟠 Oransje (5-12 uker):  ${stats.orange} henvisninger\n`
  report += `🟢 Grønn (>12 uker):     ${stats.green} henvisninger\n`
  report += `⚪ Vurderes avvist:      ${stats.rejected} henvisninger\n\n`

  report += '─────────────────────────────────────────────────\n'
  report += 'DETALJERT OVERSIKT\n'
  report += '─────────────────────────────────────────────────\n\n'

  // Group by priority
  const grouped = groupByPriority(referrals)

  for (const [priority, refs] of Object.entries(grouped)) {
    if (refs.length === 0) continue

    report += `\n${getPriorityGroupText(priority as any).toUpperCase()}\n`
    report += '═'.repeat(50) + '\n'

    refs.forEach(ref => {
      report += `\nHenvisning #${ref.referralNumber}\n`
      report += `Pasient: ${ref.patientInfo.name}, ${ref.patientInfo.age} år (${ref.patientInfo.gender})\n`
      report += `Diagnose: ${ref.assessment?.tentativeDiagnosis}\n`

      if (ref.assessment?.guidelineDescription?.conditions) {
        report += `\nOmtale i prioriteringsveileder:\n`
        ref.assessment.guidelineDescription.conditions.forEach((condition, idx) => {
          report += `  ${idx + 1}. ${condition.icon} ${condition.name}\n`
          report += `     Kilde: ${condition.source}\n`
          condition.deadlines.forEach(deadline => {
            report += `     ${deadline}\n`
          })
          report += `     Rett til nødvendig helsehjelp: ${condition.rightToHealthcare ? 'Ja' : 'Nei'}\n`
          if (condition.comment) {
            report += `     Kommentar: ${condition.comment}\n`
          }
        })
      }

      if (ref.assessment?.rejection) {
        report += `\nVurderes avvist:\n`
        if (ref.assessment.rejection.missingInformation.length > 0) {
          report += `Manglende informasjon:\n`
          ref.assessment.rejection.missingInformation.forEach(info => {
            report += `  - ${info}\n`
          })
        }
        if (ref.assessment.rejection.expectedPrimaryCareActions && ref.assessment.rejection.expectedPrimaryCareActions.length > 0) {
          report += `Forventet tiltak i primærhelsetjenesten:\n`
          ref.assessment.rejection.expectedPrimaryCareActions.forEach(action => {
            report += `  - ${action}\n`
          })
        }
      }

      report += `\nNøkkeloppsummering:\n${ref.assessment?.keySummary}\n`

      if (ref.assessment?.differentialDiagnoses && ref.assessment.differentialDiagnoses.length > 0) {
        report += `\nDifferensialdiagnoser:\n`
        ref.assessment.differentialDiagnoses.forEach(dd => {
          report += `  - ${dd}\n`
        })
      }

      report += '\n' + '─'.repeat(50) + '\n'
    })
  }

  report += '\n═══════════════════════════════════════════════════\n'
  report += '              SLUTT PÅ RAPPORT\n'
  report += '═══════════════════════════════════════════════════\n'

  return report
}

/**
 * Calculate statistics from referrals
 */
function calculateStatistics(referrals: Referral[]) {
  return {
    red: referrals.filter(r => r.assessment?.priorityGroup === 'red').length,
    orange: referrals.filter(r => r.assessment?.priorityGroup === 'orange').length,
    green: referrals.filter(r => r.assessment?.priorityGroup === 'green').length,
    rejected: referrals.filter(r => r.assessment?.priorityGroup === 'rejected').length
  }
}

/**
 * Group referrals by priority
 */
function groupByPriority(referrals: Referral[]): Record<string, Referral[]> {
  return {
    red: referrals.filter(r => r.assessment?.priorityGroup === 'red'),
    orange: referrals.filter(r => r.assessment?.priorityGroup === 'orange'),
    green: referrals.filter(r => r.assessment?.priorityGroup === 'green'),
    rejected: referrals.filter(r => r.assessment?.priorityGroup === 'rejected')
  }
}

/**
 * Get human-readable priority group text
 */
function getPriorityGroupText(group: string): string {
  switch (group) {
    case 'red':
      return 'Rød (≤4 uker)'
    case 'orange':
      return 'Oransje (5-12 uker)'
    case 'green':
      return 'Grønn (>12 uker)'
    case 'rejected':
      return 'Vurderes avvist'
    default:
      return 'Ukjent'
  }
}

/**
 * Download a file to the user's computer
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default {
  exportToJSON,
  exportToCSV,
  exportSummaryReport
}
