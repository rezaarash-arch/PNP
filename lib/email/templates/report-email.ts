/**
 * Builds a professionally designed HTML email for the assessment report.
 *
 * Design constraints for email client compatibility:
 * - Table-based layout (no flexbox/grid)
 * - All styles inline (Gmail strips <style> blocks)
 * - Arial/Helvetica fonts only (web fonts unsupported)
 * - bgcolor attribute as fallback for backgrounds
 * - Buttons as <a> tags with inline padding
 */

export interface ReportEmailParams {
  candidateName: string
  eligibleCount: number
  totalPrograms: number
  topMatch: { province: string; stream: string; probability: number } | null
  top3Programs: Array<{ province: string; stream: string; probability: number }>
  executiveSummary: string
  bookingUrl: string
}

export function buildReportEmailHtml(params: ReportEmailParams): string {
  const {
    candidateName,
    eligibleCount,
    totalPrograms,
    topMatch,
    top3Programs,
    executiveSummary,
    bookingUrl,
  } = params

  // Truncate summary to ~300 chars
  const summaryExcerpt =
    executiveSummary.length > 300
      ? executiveSummary.slice(0, 297) + '...'
      : executiveSummary

  const top3Rows = top3Programs
    .map((p, i) => {
      const dotColor = i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#0099cc'
      return `
        <tr>
          <td style="padding: 8px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${dotColor}; margin-right: 8px; vertical-align: middle;"></span>
            ${p.province} &mdash; ${p.stream}
          </td>
          <td style="padding: 8px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #0099cc; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">
            ${p.probability}%
          </td>
        </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your GenesisLink Business Immigration Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: Arial, Helvetica, sans-serif;">

<!-- Wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9;">
  <tr>
    <td align="center" style="padding: 24px 16px;">

      <!-- Main card -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td bgcolor="#0f172a" style="background-color: #0f172a; padding: 28px 32px; text-align: center;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align: center;">
                  <span style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Genesis</span><span style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #0099cc; letter-spacing: -0.5px;">Link</span>
                </td>
              </tr>
              <tr>
                <td style="text-align: center; padding-top: 6px;">
                  <span style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;">Business Immigration Report</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding: 32px 32px 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #1e293b; margin: 0 0 12px; line-height: 1.5;">
              Hi ${candidateName},
            </p>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">
              Thank you for completing the GenesisLink PNP Assessment. Your personalized Business Immigration Report is attached to this email as a PDF.
            </p>
          </td>
        </tr>

        <!-- Quick Stats -->
        <tr>
          <td style="padding: 16px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <tr>
                <td style="padding: 20px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="vertical-align: top;">
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px;">Eligible Programs</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 700; color: #0f172a; margin: 0;">
                          ${eligibleCount}<span style="font-size: 16px; color: #94a3b8; font-weight: 400;">/${totalPrograms}</span>
                        </p>
                      </td>
                      ${topMatch ? `
                      <td width="50%" style="vertical-align: top;">
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px;">Top Match</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 2px;">
                          ${topMatch.province}
                        </p>
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #0099cc; margin: 0;">
                          ${topMatch.stream} &bull; ${topMatch.probability}% probability
                        </p>
                      </td>` : ''}
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Top Programs -->
        ${top3Programs.length > 0 ? `
        <tr>
          <td style="padding: 8px 32px 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 8px;">Your Top Programs</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
              ${top3Rows}
            </table>
          </td>
        </tr>` : ''}

        <!-- Executive Summary -->
        <tr>
          <td style="padding: 8px 32px 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 8px;">Assessment Overview</p>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #475569; line-height: 1.65; margin: 0; border-left: 3px solid #0099cc; padding-left: 16px;">
              ${summaryExcerpt}
            </p>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding: 8px 32px 32px; text-align: center;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #475569; margin: 0 0 16px; line-height: 1.5;">
              Ready to take the next step? Our immigration consultants can review your profile and recommend a personalized strategy.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td style="border-radius: 8px; background-color: #0099cc;" bgcolor="#0099cc">
                  <a href="${bookingUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                    Book Your Free Consultation
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- PDF Note -->
        <tr>
          <td style="padding: 0 32px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
              <tr>
                <td style="padding: 12px 16px;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #0369a1; margin: 0;">
                    &#128206; Your full Business Immigration Report is attached as a PDF. This includes detailed scoring, program analysis, and a strategic roadmap.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding: 0 32px;">
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 24px 32px; text-align: center;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 6px;">
              GenesisLink Immigration Consulting
            </p>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #94a3b8; margin: 0 0 4px;">
              info@genesislink.ca &bull; +1 (343) 809 8804
            </p>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #94a3b8; margin: 0 0 12px;">
              www.genesislink.ca
            </p>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #cbd5e1; margin: 0;">
              This report was generated by GenesisLink's AI-powered PNP Assessment Tool.
              This is a transactional email related to your assessment request.
            </p>
          </td>
        </tr>

      </table>
      <!-- End main card -->

    </td>
  </tr>
</table>

</body>
</html>`
}
