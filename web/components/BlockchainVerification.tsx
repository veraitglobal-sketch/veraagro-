'use client';

import { useState, useEffect } from 'react';

interface VerificationResult {
  batchId: string;
  isVerified: boolean;
  registeredAt?: string;
  eventCount?: number;
  explorerUrl: string;
  txHash?: string;
  registrationTxUrl?: string;
}

interface JourneyEvent {
  eventType: string;
  timestamp: string;
}

interface BatchJourney {
  batchId: string;
  registeredAt: string;
  eventCount: number;
  events: JourneyEvent[];
  contractUrl: string;
}

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  HARVEST:       { label: 'Harvest',           icon: '🌱', color: '#22c55e' },
  PACKAGING:     { label: 'Packaging',         icon: '📦', color: '#3b82f6' },
  HANDOVER:      { label: 'Handover to logistics', icon: '🚛', color: '#f59e0b' },
  DELIVERY:      { label: 'Delivery',          icon: '✅', color: '#8b5cf6' },
  CERTIFICATION: { label: 'Certification',     icon: '🏅', color: '#ec4899' },
};

interface Props {
  batchId: string;
  estateId: string;
  harvestDate: string;
  productType: string;
}

export function BlockchainVerification({ batchId, estateId, harvestDate, productType }: Props) {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [journey, setJourney] = useState<BatchJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [showJourney, setShowJourney] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        setError(null);
        setNotConfigured(false);

        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

        const verifyRes = await fetch(`${apiBase}/api/blockchain/batches/${batchId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estateId, harvestDate, productType }),
        });
        const verifyJson = await verifyRes.json();

        if (verifyRes.status === 503 || verifyJson?.code === 'BLOCKCHAIN_NOT_CONFIGURED') {
          setNotConfigured(true);
          setLoading(false);
          return;
        }

        if (!verifyRes.ok) {
          setError(verifyJson?.message || 'Could not verify blockchain status.');
          setLoading(false);
          return;
        }

        setVerification(verifyJson.data ?? null);

        const journeyRes = await fetch(`${apiBase}/api/blockchain/batches/${batchId}/journey`);
        const journeyJson = await journeyRes.json();
        if (journeyRes.ok && journeyJson?.data) {
          setJourney(journeyJson.data);
        }
      } catch (err) {
        setError('Could not verify blockchain status.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [batchId, estateId, harvestDate, productType]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Verifying on blockchain...</p>
        </div>
      </div>
    );
  }

  if (notConfigured) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.badge, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 24 }}>🔗</span>
          <div>
            <p style={{ ...styles.badgeTitle, color: '#64748b' }}>Blockchain verification</p>
            <p style={styles.badgeSubtitle}>Not configured for this environment. Product data is still verified by Bio Vera.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.badge, background: '#fef2f2', border: '1px solid #fca5a5' }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <p style={{ ...styles.badgeTitle, color: '#dc2626' }}>Verification error</p>
            <p style={styles.badgeSubtitle}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.badge,
        background: verification.isVerified ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${verification.isVerified ? '#86efac' : '#fca5a5'}`,
      }}>
        <span style={{ fontSize: 32 }}>{verification.isVerified ? '✅' : '❌'}</span>
        <div style={{ flex: 1 }}>
          <p style={{
            ...styles.badgeTitle,
            color: verification.isVerified ? '#16a34a' : '#dc2626',
          }}>
            {verification.isVerified ? 'Verified on blockchain' : 'Not verified'}
          </p>
          {verification.isVerified && (
            <p style={styles.badgeSubtitle}>
              Registered: {new Date(verification.registeredAt!).toLocaleDateString('en-US')}
              {' · '}{verification.eventCount} step{verification.eventCount !== 1 ? 's' : ''} in chain
            </p>
          )}
        </div>
        {verification.isVerified && (
          <a
            href={verification.registrationTxUrl || verification.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.polygonBadge}
          >
            <svg width="16" height="16" viewBox="0 0 38 33" fill="none">
              <path d="M29 10.2l-9-5.2-9 5.2-9 5.2v10.4l9 5.2 9-5.2 9 5.2 9-5.2V15.4l-9-5.2z" fill="#8247e5"/>
            </svg>
            {verification.registrationTxUrl ? 'View transaction' : 'Polygon'}
          </a>
        )}
      </div>

      {journey && journey.events.length > 0 && (
        <div style={styles.journeySection}>
          <button
            onClick={() => setShowJourney(!showJourney)}
            style={styles.journeyToggle}
          >
            {showJourney ? '▲' : '▼'} Product journey ({journey.events.length} steps)
          </button>

          {showJourney && (
            <div style={styles.timeline}>
              <div style={styles.timelineItem}>
                <div style={{ ...styles.timelineDot, background: '#6b7280' }}>🔗</div>
                <div style={styles.timelineContent}>
                  <p style={styles.timelineTitle}>Registered on blockchain</p>
                  <p style={styles.timelineDate}>
                    {new Date(journey.registeredAt).toLocaleString('en-US')}
                  </p>
                </div>
              </div>
              {journey.events.map((event, i) => {
                const meta = EVENT_LABELS[event.eventType] || {
                  label: event.eventType, icon: '📍', color: '#6b7280'
                };
                return (
                  <div key={i} style={styles.timelineItem}>
                    <div style={{ ...styles.timelineDot, background: meta.color }}>
                      {meta.icon}
                    </div>
                    <div style={styles.timelineContent}>
                      <p style={styles.timelineTitle}>{meta.label}</p>
                      <p style={styles.timelineDate}>
                        {new Date(event.timestamp).toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <a
            href={journey.contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.explorerLink}
          >
            🔍 View on Polygonscan →
          </a>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: 520,
    margin: '0 auto',
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #8247e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    margin: 0,
    color: '#64748b',
    fontSize: 14,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeTitle: {
    margin: 0,
    fontWeight: 600,
    fontSize: 15,
  },
  badgeSubtitle: {
    margin: '2px 0 0',
    fontSize: 13,
    color: '#6b7280',
  },
  polygonBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: '#8247e5',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  journeySection: {
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '12px 16px',
  },
  journeyToggle: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: 600,
    padding: 0,
    marginBottom: 4,
  },
  timeline: {
    paddingTop: 12,
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    margin: 0,
    fontWeight: 600,
    fontSize: 14,
    color: '#1e293b',
  },
  timelineDate: {
    margin: '2px 0 0',
    fontSize: 12,
    color: '#94a3b8',
  },
  explorerLink: {
    display: 'block',
    marginTop: 8,
    fontSize: 12,
    color: '#8247e5',
    textDecoration: 'none',
  },
};
