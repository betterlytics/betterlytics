use isbot::Bots;
use once_cell::sync::Lazy;

static BOT_DETECTOR: Lazy<Bots> = Lazy::new(|| Bots::default());

pub const REASON_UA_EMPTY: &str = "ua-empty";
pub const REASON_UA_BLOCKLIST: &str = "ua-blocklist";

pub fn detect(user_agent: &str) -> Vec<&'static str> {
    if user_agent.is_empty() {
        return vec![REASON_UA_EMPTY];
    }

    if BOT_DETECTOR.is_bot(user_agent) {
        return vec![REASON_UA_BLOCKLIST];
    }

    Vec::new()
}
