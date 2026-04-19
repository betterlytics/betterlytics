use serde_json::Value;
use tracing::warn;

use crate::analytics::RawTrackingEvent;

#[derive(Debug, Clone)]
pub struct SanitizeConfig {
    pub max_global_properties_keys: usize,
    pub max_global_property_key_length: usize,
    pub max_global_property_value_length: usize,
}

impl Default for SanitizeConfig {
    fn default() -> Self {
        Self {
            max_global_properties_keys: 30,
            max_global_property_key_length: 64,
            max_global_property_value_length: 128,
        }
    }
}

/// Strip/truncate anything in the event that would otherwise cause validation to drop it.
/// Never errors - a malformed `global_properties` becomes `None` and the event survives.
pub fn sanitize_event(event: &mut RawTrackingEvent, cfg: &SanitizeConfig) {
    let Some(gp) = event.global_properties.take() else {
        return;
    };

    let (cleaned, was_sanitized) = sanitize_global_properties(gp, cfg);
    event.global_properties = cleaned;

    if was_sanitized {
        warn!(
            rejection_reason = "global_properties_sanitized",
            site_id = %event.site_id,
            event_name = %event.event_name,
            "Event accepted with global_properties sanitization"
        );
    }
}

fn sanitize_global_properties(value: Value, cfg: &SanitizeConfig) -> (Option<Value>, bool) {
    let obj = match value {
        Value::Object(o) => o,
        _ => return (None, true),
    };

    let mut sanitized = serde_json::Map::new();
    let mut was_sanitized = false;

    for (key, val) in obj.into_iter() {
        if sanitized.len() >= cfg.max_global_properties_keys {
            was_sanitized = true;
            break;
        }

        if key.len() > cfg.max_global_property_key_length {
            was_sanitized = true;
            continue;
        }
        if contains_control_characters(&key) {
            was_sanitized = true;
            continue;
        }

        match val {
            Value::String(s) => {
                if s.is_empty() {
                    was_sanitized = true;
                    continue;
                }
                if contains_dangerous_control_characters(&s) {
                    was_sanitized = true;
                    continue;
                }
                let truncated = if s.chars().count() > cfg.max_global_property_value_length {
                    was_sanitized = true;
                    s.chars()
                        .take(cfg.max_global_property_value_length)
                        .collect::<String>()
                } else {
                    s
                };
                sanitized.insert(key, Value::String(truncated));
            }
            Value::Number(n) => {
                const MAX_SAFE: f64 = (1u64 << 53) as f64 - 1.0;
                match n.as_f64() {
                    Some(f) if f.is_finite() && f <= MAX_SAFE && f >= -MAX_SAFE => {
                        sanitized.insert(key, Value::Number(n));
                    }
                    _ => {
                        was_sanitized = true;
                    }
                }
            }
            Value::Bool(b) => {
                sanitized.insert(key, Value::Bool(b));
            }
            _ => {
                was_sanitized = true;
            }
        }
    }

    if sanitized.is_empty() {
        (None, was_sanitized)
    } else {
        (Some(Value::Object(sanitized)), was_sanitized)
    }
}

fn contains_control_characters(input: &str) -> bool {
    input.chars().any(|c| c.is_control())
}

fn contains_dangerous_control_characters(input: &str) -> bool {
    input.chars().any(|c| c.is_control() && c != '\n' && c != '\t')
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn cfg() -> SanitizeConfig {
        SanitizeConfig::default()
    }

    #[test]
    fn valid_mixed_types_unchanged() {
        let input = json!({
            "plan": "pro",
            "count": 42,
            "active": true,
            "ratio": 0.5,
        });
        let (out, was) = sanitize_global_properties(input, &cfg());
        assert!(!was);
        let out = out.expect("expected Some value");
        let out_obj = out.as_object().unwrap();
        assert_eq!(out_obj.len(), 4);
        assert_eq!(out_obj.get("plan").unwrap(), &json!("pro"));
        assert_eq!(out_obj.get("count").unwrap(), &json!(42));
        assert_eq!(out_obj.get("active").unwrap(), &json!(true));
        assert_eq!(out_obj.get("ratio").unwrap(), &json!(0.5));
    }

    #[test]
    fn oversized_key_dropped() {
        let long_key = "k".repeat(65);
        let mut input = serde_json::Map::new();
        input.insert(long_key.clone(), json!("val"));
        input.insert("ok".to_string(), json!("ok_val"));
        let (out, was) = sanitize_global_properties(Value::Object(input), &cfg());
        assert!(was);
        let out_obj = out.unwrap();
        let out_obj = out_obj.as_object().unwrap();
        assert!(!out_obj.contains_key(&long_key));
        assert_eq!(out_obj.get("ok").unwrap(), &json!("ok_val"));
    }

    #[test]
    fn oversized_string_value_truncated() {
        let long_val: String = "a".repeat(200);
        let input = json!({ "big": long_val });
        let (out, was) = sanitize_global_properties(input, &cfg());
        assert!(was);
        let out_obj = out.unwrap();
        let got = out_obj.as_object().unwrap().get("big").unwrap();
        let got_str = got.as_str().unwrap();
        assert_eq!(got_str.chars().count(), 128);
        assert!(got_str.chars().all(|c| c == 'a'));
    }

    #[test]
    fn non_finite_number_dropped() {
        let mut m = serde_json::Map::new();
        m.insert(
            "k".to_string(),
            Value::Number(serde_json::Number::from_f64(1e20).unwrap()),
        );
        m.insert("ok".to_string(), json!(1));
        let (out, was) = sanitize_global_properties(Value::Object(m), &cfg());
        assert!(was);
        let out_obj = out.unwrap();
        let out_obj = out_obj.as_object().unwrap();
        assert!(!out_obj.contains_key("k"));
        assert_eq!(out_obj.get("ok").unwrap(), &json!(1));
    }

    #[test]
    fn array_value_dropped() {
        let input = json!({ "a": [1, 2, 3], "b": "str" });
        let (out, was) = sanitize_global_properties(input, &cfg());
        assert!(was);
        let out_obj = out.unwrap();
        let out_obj = out_obj.as_object().unwrap();
        assert!(!out_obj.contains_key("a"));
        assert_eq!(out_obj.get("b").unwrap(), &json!("str"));
    }

    #[test]
    fn null_value_dropped() {
        let input = json!({ "a": null, "b": 1 });
        let (out, was) = sanitize_global_properties(input, &cfg());
        assert!(was);
        let out_obj = out.unwrap();
        let out_obj = out_obj.as_object().unwrap();
        assert!(!out_obj.contains_key("a"));
        assert_eq!(out_obj.get("b").unwrap(), &json!(1));
    }

    #[test]
    fn empty_string_value_dropped() {
        let input = json!({ "empty": "", "ok": "v" });
        let (out, was) = sanitize_global_properties(input, &cfg());
        assert!(was);
        let out_obj = out.unwrap();
        let out_obj = out_obj.as_object().unwrap();
        assert!(!out_obj.contains_key("empty"));
        assert_eq!(out_obj.get("ok").unwrap(), &json!("v"));
    }

    #[test]
    fn too_many_keys_first_n_kept() {
        let mut m = serde_json::Map::new();
        for i in 0..40 {
            m.insert(format!("k{:02}", i), json!(i));
        }
        let (out, was) = sanitize_global_properties(Value::Object(m), &cfg());
        assert!(was);
        let out_obj = out.unwrap();
        let out_obj = out_obj.as_object().unwrap();
        assert_eq!(out_obj.len(), 30);
    }

    #[test]
    fn non_object_input_returns_none_sanitized() {
        let (out, was) = sanitize_global_properties(json!([1, 2, 3]), &cfg());
        assert!(was);
        assert!(out.is_none());
    }

    #[test]
    fn all_keys_sanitized_returns_none() {
        let input = json!({
            "a": null,
            "b": [1, 2],
            "c": "",
        });
        let (out, was) = sanitize_global_properties(input, &cfg());
        assert!(was);
        assert!(out.is_none());
    }

    #[test]
    fn control_char_key_dropped() {
        let mut m = serde_json::Map::new();
        m.insert("bad\x00key".to_string(), json!("v"));
        m.insert("ok".to_string(), json!("v"));
        let (out, was) = sanitize_global_properties(Value::Object(m), &cfg());
        assert!(was);
        let out_obj = out.unwrap();
        let out_obj = out_obj.as_object().unwrap();
        assert_eq!(out_obj.len(), 1);
        assert!(out_obj.contains_key("ok"));
    }

    #[test]
    fn bool_preserved() {
        let input = json!({ "a": true, "b": false });
        let (out, was) = sanitize_global_properties(input, &cfg());
        assert!(!was);
        let out_obj = out.unwrap();
        let out_obj = out_obj.as_object().unwrap();
        assert_eq!(out_obj.get("a").unwrap(), &json!(true));
        assert_eq!(out_obj.get("b").unwrap(), &json!(false));
    }
}
