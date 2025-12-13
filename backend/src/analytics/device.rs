/// Device type detection based on screen resolution
pub fn detect_device_type_from_resolution(screen_resolution: &str) -> Option<String> {
    if screen_resolution.is_empty() {
        return None;
    }

    if let Some((w, _h)) = screen_resolution.split_once('x') {
        if let Ok(width) = w.trim().parse::<u32>() {
            return Some(match width {
                0..=575 => "mobile".to_string(),
                576..=991 => "tablet".to_string(),
                992..=1439 => "laptop".to_string(),
                _ => "desktop".to_string(),
            });
        }
    }

    None
}

/// Detect device type from screen resolution string with fallback to "unknown"
pub fn detect_device_type_from_resolution_with_fallback(screen_resolution: &str) -> String {
    detect_device_type_from_resolution(screen_resolution).unwrap_or_else(|| "unknown".to_string())
}
