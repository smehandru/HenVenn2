import { useState } from 'react'
import './TriageGroups.css'
import { Referral, PriorityGroup } from '../types'

interface TriageGroupsProps {
  referrals: Referral[]
  onReferralSelect: (referral: Referral) => void
  selectedReferralId?: string
  onRequestRejectionLetter?: (referral: Referral) => void
  groupsLoading?: Record<PriorityGroup, boolean>
}

interface GroupConfig {
  key: PriorityGroup
  title: string
  color: string
  description: string
}

const groupConfigs: GroupConfig[] = [
  {
    key: 'red',
    title: 'Rød (≤4 uker)',
    color: '#e74c3c',
    description: 'Høy hastegrad - inntaksfrist til og med 4 uker'
  },
  {
    key: 'orange',
    title: 'Oransje (5-12 uker)',
    color: '#e67e22',
    description: 'Middels hastegrad - inntaksfrist mellom 5 og 12 uker'
  },
  {
    key: 'green',
    title: 'Grønn (>12 uker)',
    color: '#27ae60',
    description: 'Lav hastegrad - inntaksfrist over 12 uker'
  },
  {
    key: 'rejected',
    title: 'Vurderes avvist',
    color: '#7f8c8d',
    description: 'Henvisninger som vurderes avvist'
  }
]

const TriageGroups = ({ referrals, onReferralSelect, selectedReferralId, onRequestRejectionLetter, groupsLoading }: TriageGroupsProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<PriorityGroup>>(new Set())
  const [expandedReferrals, setExpandedReferrals] = useState<Set<string>>(new Set())

  const toggleGroup = (group: PriorityGroup) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleReferral = (referralId: string) => {
    const newExpanded = new Set(expandedReferrals)
    if (newExpanded.has(referralId)) {
      newExpanded.delete(referralId)
    } else {
      newExpanded.add(referralId)
    }
    setExpandedReferrals(newExpanded)
  }

  const getReferralsByGroup = (group: PriorityGroup): Referral[] => {
    return referrals.filter(ref => ref.assessment?.priorityGroup === group)
  }

  return (
    <div className="triage-groups">
      {groupConfigs.map(config => {
        const groupReferrals = getReferralsByGroup(config.key)
        const isExpanded = expandedGroups.has(config.key)
        const isLoading = groupsLoading?.[config.key] || false

        return (
          <div key={config.key} className="triage-group">
            <div
              className="group-header"
              onClick={() => toggleGroup(config.key)}
            >
              <div className="group-title">
                <span
                  className="color-indicator"
                  style={{ backgroundColor: config.color }}
                />
                <span className="title-text">{config.title}</span>
                <span className="count-badge">({groupReferrals.length})</span>
              </div>
              <div className="group-header-right">
                {isLoading && (
                  <span className="group-loading-text">
                    Vurderer<span className="loading-dots"></span>
                  </span>
                )}
                {!isLoading && groupReferrals.length > 0 && !groupReferrals.every(r => r.assessment && !r.isStreaming) && (
                  <span className="group-pending-text">Skal vurderes</span>
                )}
                {!isLoading && groupReferrals.length > 0 && groupReferrals.every(r => r.assessment && !r.isStreaming) && (
                  <span className="group-ready-text">Klart!</span>
                )}
                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="group-content">
                {groupReferrals.length === 0 ? (
                  <p className="empty-message">Ingen henvisninger i denne gruppen</p>
                ) : (
                  groupReferrals.map(referral => {
                    const isReferralExpanded = expandedReferrals.has(referral.id)
                    const isSelected = selectedReferralId === referral.id

                    return (
                      <div
                        key={referral.id}
                        className={`referral-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div
                          className="referral-header"
                          onClick={() => {
                            toggleReferral(referral.id)
                            onReferralSelect(referral)
                          }}
                        >
                          <span className="referral-number">
                            Henvisning #{referral.referralNumber}
                          </span>
                          <span className="expand-icon">
                            {isReferralExpanded ? '▼' : '▶'}
                          </span>
                        </div>

                        {isReferralExpanded && referral.assessment && (
                          <div className="referral-details">
                            {referral.isStreaming && (
                              <div className="detail-section streaming-section">
                                <h4>⏳ {referral.streamingText && referral.streamingText.trim().startsWith('{') ? 'Vurderer henvisning...' : 'Genererer vurdering...'}</h4>
                                {referral.streamingText && !referral.streamingText.trim().startsWith('{') && (
                                  <div className="streaming-text">
                                    {referral.streamingText}
                                  </div>
                                )}
                              </div>
                            )}

                            {!referral.isStreaming && (
                              <>
                                <div className="detail-section">
                                  <h4>Nøkkeloppsummering</h4>
                                  <p>{referral.assessment.keySummary}</p>
                                </div>

                                <div className="detail-section">
                                  <h4>Tentativ diagnose</h4>
                                  <p>{referral.assessment.tentativeDiagnosis}</p>
                                </div>
                              </>
                            )}

                            {!referral.isStreaming && referral.assessment.differentialDiagnoses && referral.assessment.differentialDiagnoses.length > 0 && (
                              <div className="detail-section">
                                <h4>Differensialdiagnoser</h4>
                                <ul>
                                  {referral.assessment.differentialDiagnoses.map((dd, idx) => (
                                    <li key={idx}>{dd}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {!referral.isStreaming && config.key === 'rejected' && referral.assessment.rejection ? (
                              <>
                                {referral.assessment.rejection.wrongSpecialty && (
                                  <div className="detail-section wrong-specialty-section">
                                    <h4>⚠️ Feil fagfelt</h4>
                                    <p>
                                      Denne henvisningen tilhører <strong>{referral.assessment.rejection.correctSpecialty || 'et annet fagfelt'}</strong> og
                                      bør ikke vurderes av ortopedisk avdeling.
                                    </p>
                                  </div>
                                )}

                                {referral.assessment.rejection.missingInformation.length > 0 && (
                                  <div className="detail-section">
                                    <h4>Manglende informasjon</h4>
                                    <ul>
                                      {referral.assessment.rejection.missingInformation.map((info, idx) => (
                                        <li key={idx}>{info}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {referral.assessment.rejection.expectedPrimaryCareActions.length > 0 && (
                                  <div className="detail-section">
                                    <h4>Forventet tiltak i primærhelsetjenesten</h4>
                                    <ul>
                                      {referral.assessment.rejection.expectedPrimaryCareActions.map((action, idx) => (
                                        <li key={idx}>{action}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="detail-section">
                                  <button
                                    className="rejection-letter-button"
                                    onClick={() => onRequestRejectionLetter?.(referral)}
                                  >
                                    Forslag til avslagsbrev
                                  </button>
                                </div>
                              </>
                            ) : !referral.isStreaming && referral.assessment.guidelineDescription ? (
                              <>
                                <div className="detail-section guideline-section">
                                  <h4>Omtale i prioriteringsveileder</h4>
                                  {referral.assessment.guidelineDescription.conditions.map((condition, idx) => (
                                    <div key={idx} className="condition-item">
                                      <p className="condition-name">
                                        {condition.icon} <strong>{idx + 1}. {condition.name}</strong>
                                      </p>
                                      <p className="condition-source">📖 Kilde: {condition.source}</p>
                                      {condition.deadlines.map((deadline, dIdx) => (
                                        <p key={dIdx} className="condition-deadline">{deadline}</p>
                                      ))}
                                      <p className="condition-healthcare">
                                        Rett til nødvendig helsehjelp: {condition.rightToHealthcare ? 'Ja' : 'Nei'}
                                      </p>
                                      {condition.comment && (
                                        <p className="condition-comment"><strong>Kommentar:</strong> {condition.comment}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TriageGroups
