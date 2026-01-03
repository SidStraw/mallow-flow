import { Resend } from 'resend'

let _resend: Resend | null = null

export function useResend() {
  if (!_resend) {
    const config = useRuntimeConfig()
    if (!config.resendApiKey) {
      throw new Error('RESEND_API_KEY is not defined')
    }
    _resend = new Resend(config.resendApiKey)
  }
  return _resend
}
