export async function sendSmsVerification({
  phoneNumber,
  username,
  code,
}) {
  /*
   * SMS provider integration will be connected here.
   *
   * Example future providers:
   * - Twilio
   * - Africa's Talking
   * - Vonage
   * - Other country-specific SMS providers
   *
   * The phone number is never returned to the client.
   */

  console.log(
    `SMS verification requested for ${username}`
  );

  throw new Error(
    "SMS verification is not configured yet"
  );
}