use crate::url_utils::normalize_url;
use url::Url;

/// Outbound link information for analytics tracking
#[derive(Debug, Clone, Default)]
pub struct OutboundLinkInfo {
    /// The cleaned and normalized destination URL
    pub url: String,
}

/// Process and clean an outbound link URL for storage
///
/// This function returns the domain of the url
pub fn process_outbound_link(url: &Url) -> OutboundLinkInfo {
    let cleaned_url = normalize_url(&url);
    let cleaned_url_str: String = cleaned_url.unwrap();
    OutboundLinkInfo {
        url: cleaned_url_str,
    }
}
