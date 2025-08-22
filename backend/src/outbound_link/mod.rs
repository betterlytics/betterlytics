use crate::url_utils::get_domain;

/// Outbound link information for analytics tracking
#[derive(Debug, Clone, Default)]
pub struct OutboundLinkInfo {
    /// The cleaned and normalized destination URL
    pub url: String,
}

/// Process and clean an outbound link URL for storage
/// 
/// This function returns the domain of the url
pub fn process_outbound_link(url: &str) -> OutboundLinkInfo {
    let cleaned_url = get_domain(url);
    
    OutboundLinkInfo {
        url: cleaned_url
    }
}

