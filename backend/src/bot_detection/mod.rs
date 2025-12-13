use isbot::Bots;
use once_cell::sync::Lazy;

static BOT_DETECTOR: Lazy<Bots> = Lazy::new(|| Bots::default());

pub fn is_bot(user_agent: &str) -> bool {
    if user_agent.is_empty() {
        return true;
    }

    BOT_DETECTOR.is_bot(user_agent)
}
