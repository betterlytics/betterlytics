use aes_gcm::{
    Aes256Gcm, KeyInit, Nonce,
    aead::Aead,
};
use serde::Deserialize;
use tracing::warn;

const KEY_LENGTH: usize = 32;

#[derive(Deserialize)]
struct EncryptedWrapper {
    encrypted: String,
}

/// The encrypted format is `{"encrypted": "iv_hex$ciphertext_hex$authtag_hex"}`.
/// Uses AES-256-GCM
pub fn decrypt_config(
    config: &serde_json::Value,
    secret: &str,
) -> Result<serde_json::Value, String> {
    let wrapper: EncryptedWrapper = serde_json::from_value(config.clone())
        .map_err(|e| format!("config is not in encrypted wrapper format: {e}"))?;

    let parts: Vec<&str> = wrapper.encrypted.split('$').collect();
    if parts.len() != 3 {
        return Err(format!(
            "expected iv$ciphertext$authTag, got {} parts",
            parts.len()
        ));
    }

    let iv_bytes = hex::decode(parts[0]).map_err(|e| format!("invalid IV hex: {e}"))?;
    let ciphertext = hex::decode(parts[1]).map_err(|e| format!("invalid ciphertext hex: {e}"))?;
    let auth_tag = hex::decode(parts[2]).map_err(|e| format!("invalid auth tag hex: {e}"))?;

    let key = derive_key(secret);
    let cipher =
        Aes256Gcm::new_from_slice(&key).map_err(|e| format!("failed to create cipher: {e}"))?;

    let nonce = Nonce::from_slice(&iv_bytes);

    // AES-GCM expects ciphertext || auth_tag concatenated
    let mut payload = ciphertext;
    payload.extend_from_slice(&auth_tag);

    let plaintext = cipher
        .decrypt(nonce, payload.as_ref())
        .map_err(|e| format!("decryption failed: {e}"))?;

    let json: serde_json::Value = serde_json::from_slice(&plaintext)
        .map_err(|e| format!("decrypted config is not valid JSON: {e}"))?;

    Ok(json)
}

/// Derives a 32-byte key from a secret string
/// Zero-pads if shorter, truncates if longer
fn derive_key(secret: &str) -> [u8; KEY_LENGTH] {
    let mut key = [0u8; KEY_LENGTH];
    let bytes = secret.as_bytes();
    let len = bytes.len().min(KEY_LENGTH);
    key[..len].copy_from_slice(&bytes[..len]);
    key
}
