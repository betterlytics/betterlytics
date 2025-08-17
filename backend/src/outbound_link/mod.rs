use crate::url_utils::clean_and_normalize_url;

/// Outbound link information for analytics tracking
#[derive(Debug, Clone, Default)]
pub struct OutboundLinkInfo {
    /// The cleaned and normalized destination URL
    pub url: String,
}

/// Process and clean an outbound link URL for storage
/// 
/// This function:
/// 1. Removes query parameters and fragments for privacy
/// 2. Normalizes the URL (removes www., protocol prefixes)
/// 3. Extracts the domain for categorization
pub fn process_outbound_link(url: &str) -> OutboundLinkInfo {
    let cleaned_url = clean_and_normalize_url(url);
    
    OutboundLinkInfo {
        url: cleaned_url
    }
}

