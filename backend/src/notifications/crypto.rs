use aes_gcm::{Aes256Gcm, KeyInit, aead::Aead};
use anyhow::{bail, Context, Result};

const KEY_LENGTH: usize = 32;
const IV_LENGTH: usize = 12;

/// The encrypted format is `{"encrypted": "iv_hex$ciphertext_hex$authtag_hex"}`.
/// Uses AES-256-GCM
pub fn decrypt_config(
    config: &serde_json::Value,
    key: &[u8; KEY_LENGTH],
) -> Result<serde_json::Value> {
    let encrypted_str = config
        .get("encrypted")
        .and_then(|v| v.as_str())
        .context("config is not in encrypted wrapper format: missing 'encrypted' field")?;

    let parts: Vec<&str> = encrypted_str.split('$').collect();
    if parts.len() != 3 {
        bail!(
            "expected iv$ciphertext$authTag, got {} parts",
            parts.len()
        );
    }

    let iv_bytes = hex::decode(parts[0]).context("invalid IV hex")?;
    let ciphertext = hex::decode(parts[1]).context("invalid ciphertext hex")?;
    let auth_tag = hex::decode(parts[2]).context("invalid auth tag hex")?;

    let iv: [u8; IV_LENGTH] = iv_bytes
        .try_into()
        .map_err(|_| anyhow::anyhow!("invalid IV length: expected {IV_LENGTH} bytes"))?;

    let cipher = Aes256Gcm::new(key.into());
    let nonce = aes_gcm::Nonce::from(iv);

    // AES-GCM expects ciphertext || auth_tag concatenated
    let mut payload = ciphertext;
    payload.extend_from_slice(&auth_tag);

    let plaintext = cipher
        .decrypt(&nonce, payload.as_ref())
        .map_err(|e| anyhow::anyhow!("decryption failed: {e}"))?;

    let json: serde_json::Value = serde_json::from_slice(&plaintext)
        .context("decrypted config is not valid JSON")?;

    Ok(json)
}
