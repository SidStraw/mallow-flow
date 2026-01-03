import { z } from 'zod/v4'

const schema = z.object({
  email: z.email('請輸入有效的電子郵件地址'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? '驗證失敗',
    })
  }

  const { email } = result.data
  const config = useRuntimeConfig()
  const appUrl = config.public.appUrl

  try {
    const token = await createMagicLinkToken(email)
    const magicLink = `${appUrl}/api/auth/verify?token=${token}`

    const resend = useResend()
    await resend.emails.send({
      from: 'Mallow Flow <noreply@mallow.tw>',
      to: email,
      subject: '登入 Mallow Flow',
      html: `
        <h1>歡迎使用 Mallow Flow</h1>
        <p>點擊下方連結登入您的帳戶：</p>
        <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px;">
          登入 Mallow Flow
        </a>
        <p style="margin-top: 16px; color: #666;">此連結將在 15 分鐘後失效。</p>
        <p style="color: #999; font-size: 12px;">如果您沒有請求此連結，請忽略此郵件。</p>
      `,
    })

    return { success: true, message: '登入連結已發送至您的信箱' }
  }
  catch (error) {
    console.error('Failed to send magic link:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '發送登入連結失敗，請稍後再試',
    })
  }
})
