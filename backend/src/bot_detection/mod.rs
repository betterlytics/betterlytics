use fancy_regex::Regex;
use once_cell::sync::Lazy;
use std::net::{IpAddr, SocketAddr};
use std::str::FromStr;
use uuid::Uuid;

const BOT_PATTERNS: &str = include_str!("bot_patterns.txt");

static BOT_REGEX: Lazy<Regex> = Lazy::new(|| {
    let pattern = BOT_PATTERNS
        .lines()
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .collect::<Vec<_>>()
        .join("|");
    Regex::new(&format!("(?i)(?:{})", pattern)).expect("vendored bot patterns failed to compile")
});

pub const REASON_UA_EMPTY: &str = "ua-empty";
pub const REASON_UA_BLOCKLIST: &str = "ua-blocklist";
pub const REASON_UA_TOO_SHORT: &str = "ua-too-short";
pub const REASON_UA_TOO_LONG: &str = "ua-too-long";
pub const REASON_UA_NON_ASCII: &str = "ua-non-ascii";
pub const REASON_UA_IP: &str = "ua-ip";
pub const REASON_UA_UUID: &str = "ua-uuid";

// Real browser user agents are ~70-150 chars; thresholds follow Pirsch's battle-tested values
const UA_MIN_LENGTH: usize = 17;
const UA_MAX_LENGTH: usize = 500;

pub fn detect(user_agent: &str) -> Vec<&'static str> {
    if user_agent.is_empty() {
        return vec![REASON_UA_EMPTY];
    }

    let mut reasons = Vec::new();

    if user_agent.len() < UA_MIN_LENGTH {
        reasons.push(REASON_UA_TOO_SHORT);
    }
    if user_agent.len() > UA_MAX_LENGTH {
        reasons.push(REASON_UA_TOO_LONG);
    }
    if !user_agent.is_ascii() {
        reasons.push(REASON_UA_NON_ASCII);
    }
    if parses_as_ip(user_agent) {
        reasons.push(REASON_UA_IP);
    }
    if Uuid::from_str(user_agent.trim()).is_ok() {
        reasons.push(REASON_UA_UUID);
    }

    // Fail-open: a regex engine error must never reject a potentially human event
    if BOT_REGEX.is_match(user_agent).unwrap_or(false) {
        reasons.push(REASON_UA_BLOCKLIST);
    }

    reasons
}

fn parses_as_ip(user_agent: &str) -> bool {
    let trimmed = user_agent.trim();
    IpAddr::from_str(trimmed).is_ok() || SocketAddr::from_str(trimmed).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    const BOT_USER_AGENTS: &[&str] = &[
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
        "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
        "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
        "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.6478.126 Safari/537.36",
        "Mozilla/5.0 (compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)",
        "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
        "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
        "curl/8.4.0",
        "python-requests/2.31.0",
        "Go-http-client/2.0",
        "axios/1.6.2",
        "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
        "Scrapy/2.11.0 (+https://scrapy.org)",
        "okhttp/4.12.0",
        "Java/17.0.2",
    ];

    const HUMAN_USER_AGENTS: &[&str] = &[
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
    ];

    #[test]
    fn combined_pattern_compiles() {
        assert!(BOT_REGEX.as_str().len() > 0);
    }

    #[test]
    fn detects_known_bots() {
        for ua in BOT_USER_AGENTS {
            assert!(detect(ua).contains(&REASON_UA_BLOCKLIST), "should flag: {}", ua);
        }
    }

    #[test]
    fn detects_malformed_user_agents() {
        assert!(detect("MyApp/1.0").contains(&REASON_UA_TOO_SHORT));
        assert!(detect(&"x".repeat(501)).contains(&REASON_UA_TOO_LONG));
        assert!(detect("Mozilla/5.0 (Windows NT 10.0; Win64; x64) яндекс браузер").contains(&REASON_UA_NON_ASCII));
        assert!(detect("192.168.1.1").contains(&REASON_UA_IP));
        assert!(detect("203.0.113.7:8080").contains(&REASON_UA_IP));
        assert!(detect("550e8400-e29b-41d4-a716-446655440000").contains(&REASON_UA_UUID));
    }

    #[test]
    fn passes_human_user_agents() {
        for ua in HUMAN_USER_AGENTS {
            assert!(detect(ua).is_empty(), "should not flag: {}", ua);
        }
    }

    #[test]
    fn empty_user_agent_is_bot() {
        assert_eq!(detect(""), vec![REASON_UA_EMPTY]);
    }
}
