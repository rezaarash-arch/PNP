import { Resend } from 'resend'

let _resend: Resend | null = null

function getResendClient(): Resend | null {
  if (_resend) return _resend
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — email sending disabled')
    return null
  }
  _resend = new Resend(apiKey)
  return _resend
}

export interface SendReportParams {
  to: string
  candidateName: string
  htmlBody: string
  pdfBuffer: Buffer
  pdfFilename: string
}

export async function sendReportEmail(
  params: SendReportParams
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'GenesisLink <info@genesislink.ca>',
      to: [params.to],
      bcc: ['info@genesislink.ca'],
      replyTo: 'info@genesislink.ca',
      subject: 'Your GenesisLink Business Immigration Report',
      html: params.htmlBody,
      attachments: [
        {
          filename: params.pdfFilename,
          content: params.pdfBuffer,
        },
      ],
    })

    if (error) {
      console.error('[email] Resend API error:', error)
      return { success: false, error: error.message }
    }

    console.log('[email] Report sent successfully, id:', data?.id)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[email] Failed to send report:', msg)
    return { success: false, error: msg }
  }
}
