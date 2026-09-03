export async function verifyCaptcha() {
  return { success: true, provider: process.env.CAPTCHA_PROVIDER || "mock" };
}
