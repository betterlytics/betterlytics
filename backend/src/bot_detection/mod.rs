use axum::http::HeaderMap;
use fancy_regex::Regex;
use once_cell::sync::Lazy;
use std::collections::HashSet;
use std::net::{IpAddr, SocketAddr};
use std::str::FromStr;
use url::Url;
use uuid::Uuid;

const BOT_PATTERNS: &str = include_str!("bot_patterns.txt");
const REFERRER_SPAM_DOMAINS: &str = include_str!("referrer_spam.txt");

static REFERRER_SPAM_SET: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    REFERRER_SPAM_DOMAINS
        .lines()
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .collect()
});

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
pub const REASON_UA_MISMATCH: &str = "ua-mismatch";
pub const REASON_IMPOSSIBLE_RESOLUTION: &str = "impossible-resolution";
pub const REASON_REFERRER_SPAM: &str = "referrer-spam";
pub const REASON_CLIENT_AUTOMATION: &str = "client-automation";

// Real browser user agents are ~70-150 chars; thresholds follow Pirsch's battle-tested values
const UA_MIN_LENGTH: usize = 17;
const UA_MAX_LENGTH: usize = 500;

#[derive(Default)]
pub struct DetectionInput<'a> {
    /// Client-supplied navigator.userAgent from the tracking payload
    pub user_agent: &'a str,
    /// User-Agent HTTP header of the tracking request
    pub header_user_agent: &'a str,
    /// Client-supplied screen resolution ("WxH") from the tracking payload
    pub screen_resolution: &'a str,
    /// Client-supplied document.referrer URL from the tracking payload
    pub referrer: &'a str,
    /// Tracker-reported automation signal (navigator.webdriver and similar)
    pub automation: bool,
}

pub fn detect(input: &DetectionInput) -> Vec<&'static str> {
    let user_agent = input.user_agent;
    if user_agent.is_empty() {
        return vec![REASON_UA_EMPTY];
    }

    let mut reasons = Vec::new();

    // A real browser sends the same string as the User-Agent header and navigator.userAgent
    if input.header_user_agent != user_agent {
        reasons.push(REASON_UA_MISMATCH);
    }

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

    if has_impossible_resolution(input.screen_resolution) {
        reasons.push(REASON_IMPOSSIBLE_RESOLUTION);
    }

    if is_spam_referrer(input.referrer) {
        reasons.push(REASON_REFERRER_SPAM);
    }

    if input.automation {
        reasons.push(REASON_CLIENT_AUTOMATION);
    }

    // Fail-open: a regex engine error must never reject a potentially human event
    if BOT_REGEX.is_match(user_agent).unwrap_or(false) {
        reasons.push(REASON_UA_BLOCKLIST);
    }

    reasons
}

/// Only flags parseable dimensions that no real display has (headless defaults like 0x0);
/// empty or malformed values are left to device detection's "unknown" handling
fn has_impossible_resolution(screen_resolution: &str) -> bool {
    let Some((w, h)) = screen_resolution.split_once('x') else {
        return false;
    };
    let (Ok(width), Ok(height)) = (w.trim().parse::<u32>(), h.trim().parse::<u32>()) else {
        return false;
    };

    width == 0 || height == 0 || width >= 10_000 || height >= 10_000
}

fn parses_as_ip(user_agent: &str) -> bool {
    let trimmed = user_agent.trim();
    IpAddr::from_str(trimmed).is_ok() || SocketAddr::from_str(trimmed).is_ok()
}

/// Matches the referrer host and each parent domain against the vendored spam list,
/// so `sub.spam.com` is caught by a `spam.com` entry
fn is_spam_referrer(referrer: &str) -> bool {
    if referrer.is_empty() {
        return false;
    }
    let Some(host) = Url::parse(referrer).ok().and_then(|u| u.host_str().map(str::to_ascii_lowercase)) else {
        return false;
    };

    let mut candidate = host.as_str();
    loop {
        if REFERRER_SPAM_SET.contains(candidate) {
            return true;
        }
        match candidate.split_once('.') {
            Some((_, rest)) if rest.contains('.') => candidate = rest,
            _ => return false,
        }
    }
}

/// Browser speculative loads (prefetch/prerender) execute the tracker but are not real
/// pageviews; they are dropped entirely rather than recorded as bot traffic.
pub fn is_prefetch(headers: &HeaderMap) -> bool {
    let header_value = |name: &str| {
        headers
            .get(name)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_ascii_lowercase()
    };

    if header_value("x-moz") == "prefetch" {
        return true;
    }

    for name in ["x-purpose", "purpose"] {
        let value = header_value(name);
        if value == "prefetch" || value == "preview" {
            return true;
        }
    }

    let sec_purpose = header_value("sec-purpose");
    sec_purpose.contains("prefetch") || sec_purpose.contains("prerender")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn detect_ua(user_agent: &str) -> Vec<&'static str> {
        detect(&DetectionInput {
            user_agent,
            header_user_agent: user_agent,
            screen_resolution: "1920x1080",
            referrer: "",
            ..Default::default()
        })
    }

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
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7 (Applebot/0.1; +http://www.apple.com/go/applebot)",
        "DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)",
        "Mozilla/5.0 (compatible;PetalBot;+https://webmaster.petalsearch.com/site/petalbot)",
        "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
        "TelegramBot (like TwitterBot)",
        "WhatsApp/2.23.20.0",
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Mozilla/5.0 (compatible; DataForSeoBot/1.0; +https://dataforseo.com/dataforseo-bot)",
        "Mozilla/5.0 (compatible; SeznamBot/4.0; +https://o-seznam.cz/napoveda/vyhledavani/en/seznambot-crawler/)",
        "Python/3.11 aiohttp/3.9.1",
        "Wget/1.21.4",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/2.1.1 Safari/534.34",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Chrome-Lighthouse",
        "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)",
    ];

    const HUMAN_USER_AGENTS: &[&str] = &[
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0.0.32.108 (iPhone14,3; iOS 17_5; en_US; en; scale=3.00)",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/463.0.0.28.106;FBBV/589361584;FBDV/iPhone14,3]",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 GSA/312.0.647062479",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 OPR/105.0.0.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyDesktopApp/1.2.3 Chrome/120.0.6099.291 Electron/28.2.1 Safari/537.36",
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 DuckDuckGo/5",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Safari/537.36",
        "Mozilla/5.0 (Linux; U; Android 14; en-us; 2210132C Build/UKQ1.230804.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.5993.80 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.5.290407",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Vivaldi/7.0.3495.11",
    ];

    #[test]
    fn combined_pattern_compiles() {
        assert!(BOT_REGEX.as_str().len() > 0);
    }

    #[test]
    fn detects_known_bots() {
        for ua in BOT_USER_AGENTS {
            assert!(detect_ua(ua).contains(&REASON_UA_BLOCKLIST), "should flag: {}", ua);
        }
    }

    #[test]
    fn detects_malformed_user_agents() {
        assert!(detect_ua("MyApp/1.0").contains(&REASON_UA_TOO_SHORT));
        assert!(detect_ua(&"x".repeat(501)).contains(&REASON_UA_TOO_LONG));
        assert!(detect_ua("Mozilla/5.0 (Windows NT 10.0; Win64; x64) яндекс браузер").contains(&REASON_UA_NON_ASCII));
        assert!(detect_ua("192.168.1.1").contains(&REASON_UA_IP));
        assert!(detect_ua("203.0.113.7:8080").contains(&REASON_UA_IP));
        assert!(detect_ua("550e8400-e29b-41d4-a716-446655440000").contains(&REASON_UA_UUID));
    }

    #[test]
    fn passes_human_user_agents() {
        for ua in HUMAN_USER_AGENTS {
            assert!(detect_ua(ua).is_empty(), "should not flag: {}", ua);
        }
    }

    #[test]
    fn empty_user_agent_is_bot() {
        assert_eq!(detect_ua(""), vec![REASON_UA_EMPTY]);
    }

    #[test]
    fn detects_client_automation_signal() {
        let flagged = detect(&DetectionInput {
            user_agent: HUMAN_USER_AGENTS[0],
            header_user_agent: HUMAN_USER_AGENTS[0],
            screen_resolution: "1920x1080",
            automation: true,
            ..Default::default()
        });
        assert_eq!(flagged, vec![REASON_CLIENT_AUTOMATION]);
    }

    #[test]
    fn detects_spam_referrers() {
        let detect_ref = |referrer: &str| {
            detect(&DetectionInput {
                user_agent: HUMAN_USER_AGENTS[0],
                header_user_agent: HUMAN_USER_AGENTS[0],
                screen_resolution: "1920x1080",
                referrer,
                ..Default::default()
            })
        };

        assert_eq!(detect_ref("https://semalt.com/some-page"), vec![REASON_REFERRER_SPAM]);
        assert_eq!(detect_ref("http://sub.semalt.com/"), vec![REASON_REFERRER_SPAM]);
        assert!(detect_ref("https://www.google.com/search?q=x").is_empty());
        assert!(detect_ref("https://news.ycombinator.com/").is_empty());
        assert!(detect_ref("").is_empty());
        assert!(detect_ref("not a url").is_empty());
    }

    #[test]
    fn detects_impossible_resolutions() {
        let detect_res = |screen_resolution: &str| {
            detect(&DetectionInput {
                user_agent: HUMAN_USER_AGENTS[0],
                header_user_agent: HUMAN_USER_AGENTS[0],
                screen_resolution,
                referrer: "",
                ..Default::default()
            })
        };

        assert_eq!(detect_res("0x0"), vec![REASON_IMPOSSIBLE_RESOLUTION]);
        assert_eq!(detect_res("0x1080"), vec![REASON_IMPOSSIBLE_RESOLUTION]);
        assert_eq!(detect_res("99999x99999"), vec![REASON_IMPOSSIBLE_RESOLUTION]);
        assert!(detect_res("1920x1080").is_empty());
        assert!(detect_res("390x844").is_empty());
        assert!(detect_res("7680x4320").is_empty());
        assert!(detect_res("").is_empty());
        assert!(detect_res("garbage").is_empty());
    }

    #[test]
    fn detects_header_payload_ua_mismatch() {
        let chrome = HUMAN_USER_AGENTS[0];
        let firefox = HUMAN_USER_AGENTS[4];

        let mismatch = detect(&DetectionInput {
            user_agent: chrome,
            header_user_agent: firefox,
            screen_resolution: "1920x1080",
            referrer: "",
            ..Default::default()
        });
        assert_eq!(mismatch, vec![REASON_UA_MISMATCH]);

        let missing_header = detect(&DetectionInput {
            user_agent: chrome,
            header_user_agent: "",
            screen_resolution: "1920x1080",
            referrer: "",
            ..Default::default()
        });
        assert_eq!(missing_header, vec![REASON_UA_MISMATCH]);

        let matching = detect(&DetectionInput {
            user_agent: chrome,
            header_user_agent: chrome,
            screen_resolution: "1920x1080",
            referrer: "",
            ..Default::default()
        });
        assert!(matching.is_empty());
    }

    #[test]
    fn detects_prefetch_headers() {
        let cases = [
            ("x-moz", "prefetch"),
            ("x-purpose", "prefetch"),
            ("x-purpose", "preview"),
            ("purpose", "prefetch"),
            ("sec-purpose", "prefetch;prerender"),
            ("sec-purpose", "prefetch"),
        ];
        for (name, value) in cases {
            let mut headers = HeaderMap::new();
            headers.insert(name, value.parse().unwrap());
            assert!(is_prefetch(&headers), "should detect prefetch: {}: {}", name, value);
        }

        let mut normal = HeaderMap::new();
        normal.insert("user-agent", "Mozilla/5.0".parse().unwrap());
        normal.insert("sec-fetch-mode", "cors".parse().unwrap());
        assert!(!is_prefetch(&normal));
        assert!(!is_prefetch(&HeaderMap::new()));
    }
}
