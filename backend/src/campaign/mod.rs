use url::Url;

/// Campaign tracking information
#[derive(Debug, Clone, Default)]
pub struct CampaignInfo {
    pub utm_source: Option<String>,
    pub utm_medium: Option<String>,
    pub utm_campaign: Option<String>,
    pub utm_term: Option<String>,
    pub utm_content: Option<String>,
}

/// Parse campaign parameters from a URL
pub fn parse_campaign_params(url_str: &str) -> CampaignInfo {
    let url = match Url::parse(url_str) {
        Ok(url) => url,
        Err(_) => return CampaignInfo::default(),
    };

    let mut campaign_info = CampaignInfo::default();

    for (key, value) in url.query_pairs() {
        match key.as_ref() {
            "utm_source" => campaign_info.utm_source = Some(value.to_string()),
            "utm_medium" => campaign_info.utm_medium = Some(value.to_string()),
            "utm_campaign" => campaign_info.utm_campaign = Some(value.to_string()),
            "utm_term" => campaign_info.utm_term = Some(value.to_string()),
            "utm_content" => campaign_info.utm_content = Some(value.to_string()),
            _ => {}
        }
    }

    campaign_info
}
