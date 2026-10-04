pub mod velocity;

use once_cell::sync::Lazy;
use std::collections::HashSet;
use std::str::FromStr;
use url::Url;
use uuid::Uuid;

const BOT_PATTERNS: &str = include_str!("bot_patterns.txt");
const BOT_PATTERNS_LOCAL: &str = include_str!("bot_patterns_local.txt");
const BOT_PATTERNS_SHADOW: &str = include_str!("bot_patterns_shadow.txt");
const REFERRER_SPAM_DOMAINS: &str = include_str!("referrer_spam.txt");
const HOSTING_ASNS: &str = include_str!("hosting_asns.txt");

/// Networks operated by crawler/scanner companies (each ASN verified via RDAP)
const BOT_OPERATOR_ASNS: &[u32] = &[
    401518, // OpenAI
    401864, // OpenAI
    60808,  // Anthropic
    399358, // Anthropic
    400243, // Anthropic
    401551, // Anthropic
    398324, // Censys
    398705, // Censys
    398722, // Censys
];

fn data_lines(file: &'static str) -> impl Iterator<Item = &'static str> {
    file.lines()
        .map(|line| line.strip_suffix('\r').unwrap_or(line))
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
}

static HOSTING_ASN_SET: Lazy<HashSet<u32>> = Lazy::new(|| {
    data_lines(HOSTING_ASNS).filter_map(|line| line.parse().ok()).collect()
});

static REFERRER_SPAM_SET: Lazy<HashSet<&'static str>> =
    Lazy::new(|| data_lines(REFERRER_SPAM_DOMAINS).collect());

/// Most patterns run on the linear-time `regex` engine; only the few lookaround
/// patterns fall back to backtracking `fancy_regex`
struct PatternMatcher {
    plain: Option<regex::Regex>,
    fancy: Option<fancy_regex::Regex>,
}

impl PatternMatcher {
    fn compile(sources: &[&'static str]) -> Self {
        let (plain, fancy): (Vec<_>, Vec<_>) = sources
            .iter()
            .flat_map(|source| data_lines(source))
            .partition(|p| regex::Regex::new(p).is_ok());

        let combine = |patterns: &[&str]| format!("(?i)(?:{})", patterns.join("|"));
        Self {
            plain: (!plain.is_empty()).then(|| {
                regex::Regex::new(&combine(&plain)).expect("vendored bot patterns failed to compile")
            }),
            fancy: (!fancy.is_empty()).then(|| {
                fancy_regex::Regex::new(&combine(&fancy)).expect("vendored bot patterns failed to compile")
            }),
        }
    }

    fn is_match(&self, text: &str) -> bool {
        self.plain.as_ref().is_some_and(|r| r.is_match(text))
            // Fail-open: a regex engine error must never reject a potentially human event
            || self.fancy.as_ref().is_some_and(|r| r.is_match(text).unwrap_or(false))
    }
}

static BOT_MATCHER: Lazy<PatternMatcher> =
    Lazy::new(|| PatternMatcher::compile(&[BOT_PATTERNS, BOT_PATTERNS_LOCAL]));
static BOT_HEURISTIC_MATCHER: Lazy<PatternMatcher> =
    Lazy::new(|| PatternMatcher::compile(&[BOT_PATTERNS_SHADOW]));

/// Build the pattern matchers and lists at startup instead of on the first event
pub fn warm() {
    Lazy::force(&BOT_MATCHER);
    Lazy::force(&BOT_HEURISTIC_MATCHER);
    Lazy::force(&HOSTING_ASN_SET);
    Lazy::force(&REFERRER_SPAM_SET);
}

pub const REASON_UA_BLOCKLIST: &str = "ua-blocklist";
pub const REASON_UA_BLOCKLIST_HEADER: &str = "ua-blocklist-header";
pub const REASON_UA_HEURISTIC: &str = "ua-heuristic";
pub const REASON_UA_TOO_SHORT: &str = "ua-too-short";
pub const REASON_UA_TOO_LONG: &str = "ua-too-long";
pub const REASON_UA_NON_ASCII: &str = "ua-non-ascii";
pub const REASON_UA_IP: &str = "ua-ip";
pub const REASON_UA_UUID: &str = "ua-uuid";
pub const REASON_UA_MISMATCH: &str = "ua-mismatch";
pub const REASON_IMPOSSIBLE_RESOLUTION: &str = "impossible-resolution";
pub const REASON_REFERRER_SPAM: &str = "referrer-spam";
pub const REASON_CLIENT_AUTOMATION: &str = "client-automation";
pub const REASON_BOT_NETWORK: &str = "bot-network";
pub const REASON_HOSTING_NETWORK: &str = "hosting-network";
pub const REASON_PREFETCH: &str = "prefetch";
pub const REASON_VELOCITY: &str = "velocity";
pub const REASON_MISSING_CLIENT_HINTS: &str = "missing-client-hints";
pub const REASON_STALE_CHROMIUM_NO_HINTS: &str = "stale-chromium-no-hints";
pub const REASON_CLIENT_HINTS_MISMATCH: &str = "client-hints-mismatch";
pub const REASON_STALE_BROWSER: &str = "stale-browser";

/// Only reasons with ~zero false-positive risk reject events
const ENFORCING_REASONS: &[&str] = &[
    REASON_UA_BLOCKLIST,
    REASON_CLIENT_AUTOMATION,
    REASON_STALE_CHROMIUM_NO_HINTS,
];

pub struct Detection {
    pub enforcing: Vec<&'static str>,
    pub shadow: Vec<&'static str>,
}

impl Detection {
    fn from_reasons(reasons: Vec<&'static str>) -> Self {
        let (enforcing, shadow) = reasons
            .into_iter()
            .partition(|reason| ENFORCING_REASONS.contains(reason));
        Self { enforcing, shadow }
    }

    pub fn is_empty(&self) -> bool {
        self.enforcing.is_empty() && self.shadow.is_empty()
    }

    pub fn should_reject(&self) -> bool {
        !self.enforcing.is_empty()
    }

    pub fn tagged_reasons(&self) -> Vec<String> {
        self.enforcing
            .iter()
            .map(|reason| reason.to_string())
            .chain(self.shadow.iter().map(|reason| format!("shadow:{}", reason)))
            .collect()
    }
}

const UA_MIN_LENGTH: usize = 17;
const UA_MAX_LENGTH: usize = 500;

/// Chromium sends low-entropy client hints on every request since major 89
const CLIENT_HINTS_MIN_CHROMIUM_MAJOR: u32 = 89;
/// A desktop Chromium UA below this major that sends no client hints is rejected:
/// four weeks of production shadow data (~8k sessions, 96 sites) showed no trusted
/// input event in that band, while real hint-less users only appeared on 130+.
/// Real desktop Chrome that old still exists (~4% of desktop sessions) but sends
/// the header, so it is unaffected; the rule only fires when the header is missing too.
const CLIENT_HINTS_ENFORCE_BELOW_MAJOR: u32 = 130;
/// Desktop Chromium auto-updates; majors older than this are suspect. Starts very
/// generous (~3 years behind); tighten from shadow data.
const STALE_DESKTOP_CHROMIUM_MAJOR: u32 = 110;

#[derive(Default)]
pub struct DetectionInput<'a> {
    /// Client-supplied navigator.userAgent
    pub user_agent: &'a str,
    // User-Agent HTTP header in `header_user_agent`
    pub header_user_agent: &'a str,
    pub screen_resolution: &'a str,
    pub referrer: &'a str,
    /// Tracker-reported automation signal (navigator.webdriver and similar)
    pub automation: bool,
    /// Autonomous system number of the client IP (0 = unknown)
    pub asn: u32,
    pub prefetch: bool,
    pub velocity_exceeded: bool,
    /// sec-ch-ua header ("" when the client sent none)
    pub sec_ch_ua: &'a str,
}

pub fn detect(input: &DetectionInput) -> Detection {
    Detection::from_reasons(collect_reasons(input))
}

fn collect_reasons(input: &DetectionInput) -> Vec<&'static str> {
    let user_agent = input.user_agent;
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

    if input.prefetch {
        reasons.push(REASON_PREFETCH);
    }

    if input.velocity_exceeded {
        reasons.push(REASON_VELOCITY);
    }

    if let Some(major) = chromium_major(user_agent) {
        if major >= CLIENT_HINTS_MIN_CHROMIUM_MAJOR {
            if input.sec_ch_ua.is_empty() {
                if major < CLIENT_HINTS_ENFORCE_BELOW_MAJOR && is_desktop_ua(user_agent) {
                    reasons.push(REASON_STALE_CHROMIUM_NO_HINTS);
                } else {
                    reasons.push(REASON_MISSING_CLIENT_HINTS);
                }
            } else if !input.sec_ch_ua.contains(&format!("v=\"{}\"", major)) {
                reasons.push(REASON_CLIENT_HINTS_MISMATCH);
            }
        }
        if major < STALE_DESKTOP_CHROMIUM_MAJOR && is_desktop_ua(user_agent) {
            reasons.push(REASON_STALE_BROWSER);
        }
    }

    if input.asn != 0 {
        if BOT_OPERATOR_ASNS.contains(&input.asn) {
            reasons.push(REASON_BOT_NETWORK);
        } else if HOSTING_ASN_SET.contains(&input.asn) {
            reasons.push(REASON_HOSTING_NETWORK);
        }
    }

    // The header UA is matched too: a forged POST can carry a clean payload UA
    // while the real HTTP client identifies itself in the header. Header-only hits
    // are shadow: a server-side forwarder can replace a real visitor's header UA,
    // so enforcement waits until bot_events shows such hits are never human.
    let ua = clip(user_agent);
    let header_ua = clip(input.header_user_agent);
    if BOT_MATCHER.is_match(ua) {
        reasons.push(REASON_UA_BLOCKLIST);
    } else {
        if header_ua != ua && BOT_MATCHER.is_match(header_ua) {
            reasons.push(REASON_UA_BLOCKLIST_HEADER);
        }
        if BOT_HEURISTIC_MATCHER.is_match(ua) {
            reasons.push(REASON_UA_HEURISTIC);
        }
    }

    reasons
}

/// Bounds regex input: validation allows UAs up to 8KB, but beyond the shadow
/// length limit there is no extra signal and the backtracking tier must not
/// scan attacker-sized strings
fn clip(user_agent: &str) -> &str {
    if user_agent.len() <= UA_MAX_LENGTH {
        return user_agent;
    }
    let mut end = UA_MAX_LENGTH;
    while !user_agent.is_char_boundary(end) {
        end -= 1;
    }
    &user_agent[..end]
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

/// Major version from a "Chrome/N..." token (also inside Edge/Opera/headless UAs);
/// None for non-Chromium engines like CriOS, which send no client hints
fn chromium_major(user_agent: &str) -> Option<u32> {
    let rest = &user_agent[user_agent.find("Chrome/")? + "Chrome/".len()..];
    let digits: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
    digits.parse().ok()
}

fn is_desktop_ua(user_agent: &str) -> bool {
    (user_agent.contains("Windows NT") || user_agent.contains("Macintosh") || user_agent.contains("X11;"))
        && !user_agent.contains("Mobile")
        && !user_agent.contains("Android")
}

fn parses_as_ip(user_agent: &str) -> bool {
    crate::ip_parser::parse_ip_str(user_agent.trim()).is_some()
}

/// Walks parent domains so `sub.spam.com` is caught by a `spam.com` entry
fn is_spam_referrer(referrer: &str) -> bool {
    if referrer.is_empty() {
        return false;
    }
    let Some(host) = Url::parse(referrer).ok().and_then(|u| u.host_str().map(str::to_ascii_lowercase)) else {
        return false;
    };

    // A trailing root dot ("spam.com.") is the same host; strip it so it can't dodge the list
    let mut candidate = host.trim_end_matches('.');
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

#[cfg(test)]
mod tests {
    use super::*;

    fn human_input() -> DetectionInput<'static> {
        // HUMAN_USER_AGENTS[0] is desktop Chrome 131
        DetectionInput {
            user_agent: HUMAN_USER_AGENTS[0],
            header_user_agent: HUMAN_USER_AGENTS[0],
            screen_resolution: "1920x1080",
            sec_ch_ua: "\"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
            ..Default::default()
        }
    }

    /// Client hints consistent with the UA, as a real Chromium browser would send
    fn hints_for(user_agent: &str) -> String {
        chromium_major(user_agent)
            .map(|major| format!("\"Chromium\";v=\"{}\"", major))
            .unwrap_or_default()
    }

    fn detect_ua(user_agent: &str) -> Detection {
        let sec_ch_ua = hints_for(user_agent);
        detect(&DetectionInput {
            user_agent,
            header_user_agent: user_agent,
            screen_resolution: "1920x1080",
            sec_ch_ua: &sec_ch_ua,
            ..Default::default()
        })
    }

    // Published crawler UA formats plus HTTP-client and headless defaults
    const BOT_USER_AGENTS: &[&str] = &[
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
        "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
        "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.6478.126 Safari/537.36",
        "Mozilla/5.0 (compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)",
        "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
        "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
        "python-requests/2.31.0",
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
        "Mozilla/5.0 (compatible; GoogleOther)",
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.175 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)",
        "Mediapartners-Google",
        "FeedFetcher-Google; (+http://www.google.com/feedfetcher.html)",
        "Site24x7",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Chrome-Lighthouse",
        // Local promotions backed by bot_events shadow data (see bot_patterns_local.txt)
        "Mozilla/5.0 (compatible; Baiduspider-render/2.0; +http://www.baidu.com/search/spider.html)",
        "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)",
        "Sogou web spider/4.0(+http://www.sogou.com/docs/help/webmasters.htm#07)",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko; compatible; Yeti/1.1; +https://naver.me/spd) Chrome/149.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 iubenda-radar/3.30.0",
        "Mozilla/5.0 (compatible; Dataprovider.com)",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.173 Safari/537.36 PlayStore-Google",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google-BusinessLinkVerification) Chrome/151.0.7922.173 Safari/537.36",
        "Google",
    ];

    // Real browser UAs, including in-app webviews, Electron shells, and niche
    // browsers. Must never be flagged.
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
    fn combined_patterns_compile() {
        warm();
        assert!(BOT_MATCHER.plain.is_some() && BOT_MATCHER.fancy.is_some());
        assert!(BOT_HEURISTIC_MATCHER.plain.is_some() && BOT_HEURISTIC_MATCHER.fancy.is_some());
    }

    #[test]
    fn detects_known_bots() {
        for ua in BOT_USER_AGENTS {
            assert!(detect_ua(ua).enforcing.contains(&REASON_UA_BLOCKLIST), "should flag: {}", ua);
        }
    }

    // HTTP clients with no named signature: caught only by the shadow heuristics,
    // so they are recorded but never rejected until promoted with evidence
    const HEURISTIC_ONLY_UAS: &[&str] = &[
        "curl/8.4.0",
        "axios/1.6.2",
        "Go-http-client/2.0",
        "okhttp/4.12.0",
        "Scrapy/2.11.0 (+https://scrapy.org)",
        // Named crawler whose only upstream coverage is a demoted generic token
        // (node\b); shadow until bot_events evidence promotes a signature
        "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
    ];

    #[test]
    fn unnamed_http_clients_are_shadow_flagged() {
        for ua in HEURISTIC_ONLY_UAS {
            let detection = detect_ua(ua);
            assert!(!detection.should_reject(), "should not reject: {}", ua);
            assert!(detection.shadow.contains(&REASON_UA_HEURISTIC), "should shadow-flag: {}", ua);
        }
    }

    #[test]
    fn malformed_user_agents_are_shadow_flagged() {
        assert!(detect_ua("MyApp/1.0").shadow.contains(&REASON_UA_TOO_SHORT));
        assert!(detect_ua(&"x".repeat(501)).shadow.contains(&REASON_UA_TOO_LONG));
        assert!(detect_ua("Mozilla/5.0 (Windows NT 10.0; Win64; x64) яндекс браузер").shadow.contains(&REASON_UA_NON_ASCII));
        assert!(detect_ua("192.168.1.1").shadow.contains(&REASON_UA_IP));
        assert!(detect_ua("203.0.113.7:8080").shadow.contains(&REASON_UA_IP));
        assert!(detect_ua("550e8400-e29b-41d4-a716-446655440000").shadow.contains(&REASON_UA_UUID));
    }

    #[test]
    fn demoted_generic_tokens_are_shadow_flagged() {
        // The generic "google" and "24x7" patterns run in shadow, so novel
        // vendor-branded tokens are recorded but never rejected
        for ua in [
            "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 GoogleShoppingApp/2.0",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Pharmacy24x7/3.1",
        ] {
            let detection = detect_ua(ua);
            assert!(!detection.should_reject(), "should not reject: {}", ua);
            assert!(detection.shadow.contains(&REASON_UA_HEURISTIC), "should shadow-flag: {}", ua);
        }
    }

    #[test]
    fn heuristic_patterns_are_shadow_flagged() {
        // Caught only by a demoted generic-word heuristic ("download"), not by any
        // named signature: recorded but never rejected
        let detection = detect_ua("Mozilla/5.0 (Windows NT 10.0; Win64; x64) SuperDownloader Deluxe");
        assert_eq!(detection.shadow, vec![REASON_UA_HEURISTIC]);
        assert!(detection.enforcing.is_empty());
        assert!(!detection.should_reject());
        assert_eq!(detection.tagged_reasons(), vec!["shadow:ua-heuristic"]);

        // An enforced signature match suppresses the redundant heuristic tag
        let enforced = detect_ua(BOT_USER_AGENTS[0]);
        assert!(enforced.enforcing.contains(&REASON_UA_BLOCKLIST));
        assert!(!enforced.shadow.contains(&REASON_UA_HEURISTIC));
    }

    #[test]
    fn shadow_only_detections_do_not_reject() {
        let detection = detect(&DetectionInput {
            header_user_agent: HUMAN_USER_AGENTS[4],
            ..human_input()
        });
        assert!(!detection.should_reject());
        assert!(!detection.is_empty());
        assert_eq!(detection.tagged_reasons(), vec!["shadow:ua-mismatch"]);

        let mixed = detect_ua("Wget/1.21.4");
        assert!(mixed.should_reject());
        assert_eq!(mixed.enforcing, vec![REASON_UA_BLOCKLIST]);
        assert_eq!(mixed.tagged_reasons(), vec!["ua-blocklist", "shadow:ua-too-short"]);
    }

    #[test]
    fn passes_human_user_agents() {
        for ua in HUMAN_USER_AGENTS {
            assert!(detect_ua(ua).is_empty(), "should not flag: {}", ua);
        }
    }

    #[test]
    fn detects_client_automation_signal() {
        let flagged = detect(&DetectionInput { automation: true, ..human_input() });
        assert_eq!(flagged.enforcing, vec![REASON_CLIENT_AUTOMATION]);
        assert!(flagged.should_reject());
    }

    #[test]
    fn classifies_networks_by_asn() {
        let detect_asn = |asn: u32| detect(&DetectionInput { asn, ..human_input() });

        let bot_operator = detect_asn(401518);
        assert_eq!(bot_operator.shadow, vec![REASON_BOT_NETWORK]);
        assert!(!bot_operator.should_reject());
        assert_eq!(bot_operator.tagged_reasons(), vec!["shadow:bot-network"]);

        let hetzner = detect_asn(24940);
        assert_eq!(hetzner.shadow, vec![REASON_HOSTING_NETWORK]);
        assert!(!hetzner.should_reject());
        assert_eq!(hetzner.tagged_reasons(), vec!["shadow:hosting-network"]);

        assert!(detect_asn(7922).is_empty());
        assert!(detect_asn(0).is_empty());
    }

    #[test]
    fn detects_spam_referrers() {
        let detect_ref = |referrer: &str| detect(&DetectionInput { referrer, ..human_input() });

        // Shadow, not enforced: the vendored list has no false-positive guard and the
        // parent-domain walk means one over-broad entry would eat a real referral source
        assert_eq!(detect_ref("https://semalt.com/some-page").shadow, vec![REASON_REFERRER_SPAM]);
        assert_eq!(detect_ref("http://sub.semalt.com/").shadow, vec![REASON_REFERRER_SPAM]);
        assert_eq!(detect_ref("https://semalt.com./").shadow, vec![REASON_REFERRER_SPAM]);
        assert!(!detect_ref("https://semalt.com/some-page").should_reject());
        assert!(detect_ref("https://www.google.com/search?q=x").is_empty());
        assert!(detect_ref("https://news.ycombinator.com/").is_empty());
        assert!(detect_ref("").is_empty());
        assert!(detect_ref("not a url").is_empty());
    }

    #[test]
    fn detects_impossible_resolutions() {
        let detect_res =
            |screen_resolution: &str| detect(&DetectionInput { screen_resolution, ..human_input() });

        assert_eq!(detect_res("0x0").shadow, vec![REASON_IMPOSSIBLE_RESOLUTION]);
        assert_eq!(detect_res("0x1080").shadow, vec![REASON_IMPOSSIBLE_RESOLUTION]);
        assert_eq!(detect_res("99999x99999").shadow, vec![REASON_IMPOSSIBLE_RESOLUTION]);
        assert!(!detect_res("0x0").should_reject());
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

        let mismatch = detect(&DetectionInput { header_user_agent: firefox, ..human_input() });
        assert_eq!(mismatch.shadow, vec![REASON_UA_MISMATCH]);
        assert!(!mismatch.should_reject());

        let missing_header = detect(&DetectionInput { header_user_agent: "", ..human_input() });
        assert_eq!(missing_header.shadow, vec![REASON_UA_MISMATCH]);
        assert!(!missing_header.should_reject());

        assert!(detect(&DetectionInput { header_user_agent: chrome, ..human_input() }).is_empty());
    }

    #[test]
    fn velocity_is_shadow_only() {
        let detection = detect(&DetectionInput { velocity_exceeded: true, ..human_input() });
        assert_eq!(detection.shadow, vec![REASON_VELOCITY]);
        assert!(!detection.should_reject());
        assert_eq!(detection.tagged_reasons(), vec!["shadow:velocity"]);
    }

    #[test]
    fn header_ua_blocklist_hit_is_shadow_only() {
        // Forged POST: clean payload UA, but the HTTP client names itself in the header.
        // Shadow, not enforced: a first-party proxy may legitimately rewrite the header
        let detection = detect(&DetectionInput {
            header_user_agent: "Wget/1.21.4",
            ..human_input()
        });
        assert!(detection.shadow.contains(&REASON_UA_BLOCKLIST_HEADER));
        assert!(detection.shadow.contains(&REASON_UA_MISMATCH));
        assert!(!detection.should_reject());

        // A blocklist hit on the payload UA itself still rejects
        assert!(detect(&DetectionInput {
            user_agent: "Wget/1.21.4",
            header_user_agent: "Wget/1.21.4",
            ..Default::default()
        })
        .should_reject());
    }

    #[test]
    fn oversized_ua_is_clipped_before_matching() {
        let ua = format!("Mozilla/5.0 {}", "x".repeat(9000));
        let detection = detect_ua(&ua);
        assert!(!detection.should_reject());
        assert!(detection.shadow.contains(&REASON_UA_TOO_LONG));
    }

    #[test]
    fn current_chromium_without_client_hints_is_shadow_flagged() {
        // Desktop Chrome 131: real hint-less users exist on 130+, so shadow only
        let detection = detect(&DetectionInput { sec_ch_ua: "", ..human_input() });
        assert_eq!(detection.shadow, vec![REASON_MISSING_CLIENT_HINTS]);
        assert!(!detection.should_reject());
    }

    #[test]
    fn stale_desktop_chromium_without_client_hints_rejects() {
        let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";
        let detection = detect(&DetectionInput {
            user_agent: ua,
            header_user_agent: ua,
            screen_resolution: "1280x1200",
            sec_ch_ua: "",
            ..Default::default()
        });
        assert_eq!(detection.enforcing, vec![REASON_STALE_CHROMIUM_NO_HINTS]);
        assert!(detection.should_reject());
        assert_eq!(detection.tagged_reasons(), vec!["stale-chromium-no-hints"]);

        // The same major with consistent hints is a plain (if unusual) browser
        assert!(detect_ua(ua).is_empty());

        // Mobile Chromium without hints stays shadow: webviews and vendor browsers
        // (Samsung Internet, HeyTap, WeChat) legitimately omit them
        let mobile = "Mozilla/5.0 (Linux; Android 13; SM-A145R) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36";
        let detection = detect(&DetectionInput {
            user_agent: mobile,
            header_user_agent: mobile,
            screen_resolution: "412x915",
            sec_ch_ua: "",
            ..Default::default()
        });
        assert_eq!(detection.shadow, vec![REASON_MISSING_CLIENT_HINTS]);
        assert!(!detection.should_reject());
    }

    #[test]
    fn client_hints_major_mismatch_is_shadow_flagged() {
        let detection = detect(&DetectionInput {
            sec_ch_ua: "\"Chromium\";v=\"120\", \"Not_A Brand\";v=\"24\"",
            ..human_input()
        });
        assert_eq!(detection.shadow, vec![REASON_CLIENT_HINTS_MISMATCH]);
        assert!(!detection.should_reject());
    }

    #[test]
    fn stale_desktop_chromium_is_shadow_flagged() {
        // Consistent hints, but a desktop Chrome major years behind auto-update
        let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36";
        let detection = detect_ua(ua);
        assert_eq!(detection.shadow, vec![REASON_STALE_BROWSER]);
        assert!(!detection.should_reject());

        // Same major on mobile is exempt: mobile Chromium does not reliably auto-update
        let mobile = "Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Mobile Safari/537.36";
        assert!(detect_ua(mobile).is_empty());

        // Non-Chromium engines have no client-hints or staleness expectations
        assert!(detect_ua(HUMAN_USER_AGENTS[4]).is_empty());
    }

    #[test]
    fn prefetch_is_shadow_only() {
        let detection = detect(&DetectionInput { prefetch: true, ..human_input() });
        assert_eq!(detection.shadow, vec![REASON_PREFETCH]);
        assert!(!detection.should_reject());
        assert_eq!(detection.tagged_reasons(), vec!["shadow:prefetch"]);
    }
}
