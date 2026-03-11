use md5::Digest;
use sha2::Sha256;

#[derive(Debug, PartialEq)]
struct StackFrame {
    function_name: String,
    filename: String,
    line: String,
}

pub fn generate_error_fingerprint(error_type: &str, exception_list_json: &str) -> String {
    if exception_list_json.is_empty() {
        return String::new();
    }

    let (message, stack) = extract_from_exception_list(exception_list_json);
    let frames = parse_stack_frames(&stack);

    let input = if !frames.is_empty() {
        let frames_str: Vec<String> = frames
            .iter()
            .take(5)
            .map(|f| format!("{}:{}:{}", f.function_name, f.filename, f.line))
            .collect();
        format!("{}:{}", error_type, frames_str.join("|"))
    } else {
        format!("{}:{}", error_type, message)
    };

    let mut hasher = Sha256::new();
    hasher.update(&input);
    let result = hasher.finalize();
    let hex = format!("{:x}", result);
    hex[..32].to_string()
}

fn extract_from_exception_list(json: &str) -> (String, String) {
    if let Ok(arr) = serde_json::from_str::<serde_json::Value>(json) {
        let message = arr[0]["value"].as_str().unwrap_or("").to_string();
        let stack = arr[0]["stack"].as_str().unwrap_or("").to_string();
        (message, stack)
    } else {
        (String::new(), String::new())
    }
}

fn parse_stack_frames(stack: &str) -> Vec<StackFrame> {
    let mut frames = Vec::new();

    for line in stack.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if let Some(frame) = parse_v8_frame(trimmed).or_else(|| parse_firefox_frame(trimmed)) {
            frames.push(frame);
        }
    }

    frames
}

fn parse_v8_frame(line: &str) -> Option<StackFrame> {
    let rest = line.strip_prefix("at ")?;

    if let Some(paren_start) = rest.rfind('(') {
        // `at functionName (location)`
        let func_name = rest[..paren_start].trim().to_string();
        let location = rest[paren_start + 1..].trim_end_matches(')');
        let (filename, line_num) = parse_location(location)?;
        Some(StackFrame {
            function_name: if func_name.is_empty() { "<anonymous>".to_string() } else { func_name },
            filename,
            line: line_num,
        })
    } else {
        // `at location` (anonymous)
        let (filename, line_num) = parse_location(rest.trim())?;
        Some(StackFrame {
            function_name: "<anonymous>".to_string(),
            filename,
            line: line_num,
        })
    }
}

/// Parse Firefox/SpiderMonkey-style frames: `functionName@http://host/path/file.js:10:5`
fn parse_firefox_frame(line: &str) -> Option<StackFrame> {
    let at_pos = line.find('@')?;
    let func_name = &line[..at_pos];
    let location = &line[at_pos + 1..];

    // Must look like a location (contains `:` and a number)
    let (filename, line_num) = parse_location(location)?;
    Some(StackFrame {
        function_name: if func_name.is_empty() { "<anonymous>".to_string() } else { func_name.to_string() },
        filename,
        line: line_num,
    })
}

/// Parse a location string like `http://host/path/file.js:10:5` or `file.js:10:5`
fn parse_location(location: &str) -> Option<(String, String)> {
    // Split from the right to find :line:col or :line (e.g., http://example.com/app.js:42:15 or http://example.com/app.js:42)
    let parts: Vec<&str> = location.rsplitn(3, ':').collect();

    let (path, line_num) = match parts.len() {
        // path:line:col (e.g., http://example.com/app.js:42:15)
        3 => {
            let line_str = parts[1];
            if line_str.parse::<u32>().is_ok() {
                (parts[2], line_str.to_string())
            } else {
                return None;
            }
        }
        // path:line (e.g., http://example.com/app.js:42)
        2 => {
            let line_str = parts[0];
            if line_str.parse::<u32>().is_ok() {
                (parts[1], line_str.to_string())
            } else {
                return None;
            }
        }
        _ => return None,
    };

    let filename = normalize_filename(path);
    if filename.is_empty() {
        return None;
    }

    Some((filename, line_num))
}

fn normalize_filename(raw: &str) -> String {
    let without_protocol = if let Some(pos) = raw.find("://") {
        &raw[pos + 3..]
    } else {
        raw
    };

    if let Some(slash_pos) = without_protocol.find('/') {
        let path = &without_protocol[slash_pos + 1..];
        path.to_string()
    } else {
        // No slash means it's already just a filename
        without_protocol.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_v8_named_function() {
        let frames = parse_stack_frames(
            "TypeError: Cannot read property 'x' of undefined\n    at UserList (http://example.com/_next/static/chunks/app.js:42:15)"
        );
        assert_eq!(frames.len(), 1);
        assert_eq!(frames[0].function_name, "UserList");
        assert_eq!(frames[0].filename, "_next/static/chunks/app.js");
        assert_eq!(frames[0].line, "42");
    }

    #[test]
    fn test_parse_v8_anonymous() {
        let frames = parse_stack_frames(
            "    at http://example.com/app.js:10:5"
        );
        assert_eq!(frames.len(), 1);
        assert_eq!(frames[0].function_name, "<anonymous>");
        assert_eq!(frames[0].filename, "app.js");
        assert_eq!(frames[0].line, "10");
    }

    #[test]
    fn test_parse_firefox_format() {
        let frames = parse_stack_frames(
            "handleClick@http://example.com/static/main.js:25:8"
        );
        assert_eq!(frames.len(), 1);
        assert_eq!(frames[0].function_name, "handleClick");
        assert_eq!(frames[0].filename, "static/main.js");
        assert_eq!(frames[0].line, "25");
    }

    #[test]
    fn test_parse_firefox_anonymous() {
        let frames = parse_stack_frames(
            "@http://example.com/bundle.js:100:3"
        );
        assert_eq!(frames.len(), 1);
        assert_eq!(frames[0].function_name, "<anonymous>");
        assert_eq!(frames[0].filename, "bundle.js");
        assert_eq!(frames[0].line, "100");
    }

    #[test]
    fn test_parse_multiple_frames() {
        let stack = "Error: something\n\
            at foo (http://example.com/a.js:1:1)\n\
            at bar (http://example.com/b.js:2:3)\n\
            at baz (http://example.com/c.js:3:5)";
        let frames = parse_stack_frames(stack);
        assert_eq!(frames.len(), 3);
        assert_eq!(frames[0].function_name, "foo");
        assert_eq!(frames[1].function_name, "bar");
        assert_eq!(frames[2].function_name, "baz");
    }

    #[test]
    fn test_column_dropped() {
        let frames_with_col = parse_stack_frames("    at f (http://example.com/a.js:10:99)");
        let frames_with_diff_col = parse_stack_frames("    at f (http://example.com/a.js:10:1)");
        assert_eq!(frames_with_col[0].line, "10");
        assert_eq!(frames_with_diff_col[0].line, "10");
    }

    #[test]
    fn test_empty_stack_fallback() {
        let fp = generate_error_fingerprint("TypeError", r#"[{"type":"TypeError","value":"oops","mechanism":"onuncaughtexception","stack":""}]"#);
        assert!(!fp.is_empty());
        assert_eq!(fp.len(), 32);
    }

    #[test]
    fn test_no_stack_uses_message() {
        let fp1 = generate_error_fingerprint("TypeError", r#"[{"type":"TypeError","value":"msg A","stack":""}]"#);
        let fp2 = generate_error_fingerprint("TypeError", r#"[{"type":"TypeError","value":"msg B","stack":""}]"#);
        assert_ne!(fp1, fp2);
    }

    #[test]
    fn test_same_stack_different_messages_same_fingerprint() {
        let stack = "at handler (http://example.com/app.js:42:15)";
        let fp1 = generate_error_fingerprint(
            "TypeError",
            &format!(r#"[{{"type":"TypeError","value":"Cannot find user 123","stack":"{}"}}]"#, stack),
        );
        let fp2 = generate_error_fingerprint(
            "TypeError",
            &format!(r#"[{{"type":"TypeError","value":"Cannot find user 456","stack":"{}"}}]"#, stack),
        );
        assert_eq!(fp1, fp2);
    }

    #[test]
    fn test_same_message_different_stacks_different_fingerprint() {
        let fp1 = generate_error_fingerprint(
            "TypeError",
            r#"[{"type":"TypeError","value":"oops","stack":"at foo (http://example.com/a.js:10:1)"}]"#,
        );
        let fp2 = generate_error_fingerprint(
            "TypeError",
            r#"[{"type":"TypeError","value":"oops","stack":"at bar (http://example.com/b.js:20:1)"}]"#,
        );
        assert_ne!(fp1, fp2);
    }

    #[test]
    fn test_empty_exception_list() {
        let fp = generate_error_fingerprint("TypeError", "");
        assert!(fp.is_empty());
    }

    #[test]
    fn test_invalid_json() {
        let fp = generate_error_fingerprint("TypeError", "not json");
        // Falls back to type + empty message
        assert_eq!(fp.len(), 32);
    }

    #[test]
    fn test_normalize_filename() {
        assert_eq!(normalize_filename("http://example.com/_next/static/app.js"), "_next/static/app.js");
        assert_eq!(normalize_filename("https://cdn.example.com/bundle.js"), "bundle.js");
        assert_eq!(normalize_filename("app.js"), "app.js");
    }
}
