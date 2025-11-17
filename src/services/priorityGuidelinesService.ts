/**
 * Service for integrating with Helsedirektoratet's prioritization guidelines API
 *
 * This service will handle:
 * - Fetching priority guidelines for specific orthopedic conditions
 * - Comparing referral diagnoses with national guidelines
 * - Determining recommended intake deadlines
 */

export interface PriorityGuideline {
  condition: string
  icd10Code?: string
  description: string
  recommendedDeadlineWeeks: number
  criteriaForPrioritization: string[]
  redFlags: string[]
}

/**
 * Fetch priority guidelines from Helsedirektoratet API
 * TODO: Implement actual API integration
 */
export async function fetchPriorityGuidelines(): Promise<PriorityGuideline[]> {
  // Placeholder for API integration
  // const response = await fetch('https://api.helsedirektoratet.no/prioriteringsveileder')
  // return await response.json()

  console.warn('Using mock priority guidelines. API integration not yet implemented.')
  return getMockPriorityGuidelines()
}

/**
 * Get priority guideline for a specific condition
 */
export async function getPriorityGuidelineForCondition(
  condition: string
): Promise<PriorityGuideline | null> {
  const guidelines = await fetchPriorityGuidelines()
  return guidelines.find(g =>
    g.condition.toLowerCase().includes(condition.toLowerCase())
  ) || null
}

/**
 * Determine priority group based on deadline weeks
 */
export function determinePriorityGroup(deadlineWeeks: number): 'red' | 'orange' | 'green' {
  if (deadlineWeeks <= 4) return 'red'
  if (deadlineWeeks <= 12) return 'orange'
  return 'green'
}

/**
 * Mock priority guidelines for development
 * These should match actual Norwegian prioritization guidelines
 */
function getMockPriorityGuidelines(): PriorityGuideline[] {
  return [
    {
      condition: 'Akutt ligamentruptur med betydelig instabilitet',
      icd10Code: 'S83.5',
      description: 'Ruptur av korsbånd eller kollateralligament med betydelig funksjonsnedsettelse',
      recommendedDeadlineWeeks: 2,
      criteriaForPrioritization: [
        'Akutt debut (<2 uker)',
        'Betydelig funksjonsnedsettelse',
        'Objektive funn ved undersøkelse'
      ],
      redFlags: ['Kombinert ligamentskade', 'Vaskulær påvirkning']
    },
    {
      condition: 'Rotatorcuff-ruptur med betydelige symptomer',
      icd10Code: 'M75.1',
      description: 'Komplett eller delvis ruptur av rotatorcuff med nattsmerter og funksjonsnedsettelse',
      recommendedDeadlineWeeks: 8,
      criteriaForPrioritization: [
        'Nattsmerter som forstyrrer søvn',
        'Ikke respondert på konservativ behandling >3 måneder',
        'Betydelig funksjonsnedsettelse'
      ],
      redFlags: ['Muskelatrofi', 'Progredierende pareser']
    },
    {
      condition: 'Hofteartrose',
      icd10Code: 'M16.1',
      description: 'Artrose i hofte med betydelig symptombyrde',
      recommendedDeadlineWeeks: 16,
      criteriaForPrioritization: [
        'Betydelig redusert livskvalitet',
        'Ikke respondert på konservativ behandling >6 måneder',
        'Røntgenverifikert artrose'
      ],
      redFlags: ['Akutt forverring', 'Betydelig gangnedsettelse']
    },
    {
      condition: 'Cervikal radikulopati med nevrologiske utfall',
      icd10Code: 'M50.1',
      description: 'Diskusprolaps med nerverotkompresjon og progredierte nevrologiske utfall',
      recommendedDeadlineWeeks: 2,
      criteriaForPrioritization: [
        'Progressive nevrologiske utfall',
        'Bildefunn som korrelerer med klinikk',
        'Betydelig smertebilde'
      ],
      redFlags: ['Myelopati', 'Progredierende pareser', 'Sfinktersvikt']
    }
  ]
}

export default {
  fetchPriorityGuidelines,
  getPriorityGuidelineForCondition,
  determinePriorityGroup
}
