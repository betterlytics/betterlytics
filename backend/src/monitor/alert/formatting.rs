use chrono::Duration;

pub fn format_duration(duration: Duration) -> String {
    let total_seconds = duration.num_seconds();

    if total_seconds < 60 {
        format!("{} seconds", total_seconds)
    } else if total_seconds < 3600 {
        let minutes = total_seconds / 60;
        let seconds = total_seconds % 60;
        if seconds == 0 {
            format!("{} minute{}", minutes, if minutes == 1 { "" } else { "s" })
        } else {
            format!("{} min {} sec", minutes, seconds)
        }
    } else if total_seconds < 86400 {
        let hours = total_seconds / 3600;
        let minutes = (total_seconds % 3600) / 60;
        if minutes == 0 {
            format!("{} hour{}", hours, if hours == 1 { "" } else { "s" })
        } else {
            format!("{} hr {} min", hours, minutes)
        }
    } else {
        let days = total_seconds / 86400;
        let hours = (total_seconds % 86400) / 3600;
        if hours == 0 {
            format!("{} day{}", days, if days == 1 { "" } else { "s" })
        } else {
            format!(
                "{} day{} {} hr",
                days,
                if days == 1 { "" } else { "s" },
                hours
            )
        }
    }
}

pub fn format_ssl_days_left(days: i32) -> String {
    if days <= 0 {
        "Certificate has expired!".to_string()
    } else if days == 1 {
        "1 day remaining".to_string()
    } else {
        format!("{} days remaining", days)
    }
}
