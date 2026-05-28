/** Fires outbound webhook to GHL — triggers Email #1 (access link) */
export async function sendAccessWebhook(payload: {
  email: string
  name: string
  firstName: string
  tokenUrl: string
}) {
  const url = process.env.GHL_ACCESS_WEBHOOK_URL
  if (!url) { console.warn('[GHL] GHL_ACCESS_WEBHOOK_URL not set — skipping'); return }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error('[GHL] sendAccessWebhook failed:', e)
  }
}

/** Fires outbound webhook to GHL — triggers Email #2 (report ready) */
export async function sendReportWebhook(payload: {
  email: string
  firstName: string
  phone?: string
  reportUrl: string
  score: number
  scoreCategory: string
}) {
  const url = process.env.GHL_REPORT_WEBHOOK_URL
  if (!url) { console.warn('[GHL] GHL_REPORT_WEBHOOK_URL not set — skipping'); return }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error('[GHL] sendReportWebhook failed:', e)
  }
}
