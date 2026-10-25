//! Keeps a check at one ongoing incident: decides which stored ongoing incident a
//! check continues and which ones get closed, given what memory holds for it.

use std::collections::{BTreeMap, HashMap};

use chrono::{DateTime, Duration, Utc};

use super::{IncidentSeed, IncidentSnapshot, IncidentState};

#[derive(Debug, Default)]
pub struct Reconciliation {
    /// The stored incident to continue, because memory holds no ongoing incident.
    pub adopt: Option<IncidentSeed>,
    /// Stored ongoing incidents to resolve at their last failed check.
    pub close: Vec<IncidentSeed>,
    /// A stored ongoing incident memory already resolved: its resolved row never landed.
    pub lost_resolution: Option<IncidentSeed>,
}

impl Reconciliation {
    pub fn is_empty(&self) -> bool {
        self.adopt.is_none() && self.close.is_empty() && self.lost_resolution.is_none()
    }
}

/// Reconciles one check's stored ongoing incidents against memory.
///
/// - Memory has an ongoing incident: it is the one, every other stored one is a duplicate.
/// - Memory resolved an incident that is still stored as ongoing: that resolution was lost.
///   Stored ones whose last failed check is before memory's resolution are stale.
/// - Of the rest, the one with the most recent failed check is continued, the others closed.
pub fn reconcile(memory: Option<&IncidentSnapshot>, mut stored: Vec<IncidentSeed>) -> Reconciliation {
    sort_newest_first(&mut stored);

    let mut plan = Reconciliation::default();
    let memory_incident = memory.and_then(|m| m.incident_id.map(|id| (id, m)));

    match memory_incident {
        Some((id, m)) if m.state == IncidentState::Ongoing => {
            plan.close = stored.into_iter().filter(|seed| seed.incident_id != id).collect();
        }
        Some((id, m)) => {
            let mut remaining = Vec::with_capacity(stored.len());
            for seed in stored {
                if seed.incident_id == id {
                    plan.lost_resolution = Some(seed);
                } else if m.resolved_at.is_some_and(|resolved| seed.last_event_at <= resolved) {
                    plan.close.push(seed);
                } else {
                    remaining.push(seed);
                }
            }
            adopt_newest(&mut plan, remaining);
        }
        None => adopt_newest(&mut plan, stored),
    }

    plan
}

fn adopt_newest(plan: &mut Reconciliation, newest_first: Vec<IncidentSeed>) {
    let mut seeds = newest_first.into_iter();
    plan.adopt = seeds.next();
    plan.close.extend(seeds);
}

fn sort_newest_first(seeds: &mut [IncidentSeed]) {
    seeds.sort_by(|a, b| {
        b.last_event_at
            .cmp(&a.last_event_at)
            .then_with(|| b.started_at.cmp(&a.started_at))
            .then_with(|| b.incident_id.cmp(&a.incident_id))
    });
}

/// One incident per check: the one with the most recent failed check.
pub fn newest_per_check(seeds: &[IncidentSeed]) -> Vec<IncidentSeed> {
    let mut sorted = seeds.to_vec();
    sort_newest_first(&mut sorted);

    let mut newest: BTreeMap<String, IncidentSeed> = BTreeMap::new();
    for seed in sorted {
        newest.entry(seed.check_id.clone()).or_insert(seed);
    }
    newest.into_values().collect()
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CheckStatus {
    Active,
    Paused,
}

#[derive(Debug)]
pub struct CheckPlan {
    pub check_id: String,
    /// The check (or its dashboard) is deleted: every stored ongoing incident is closed.
    pub deleted: bool,
    pub reconciliation: Reconciliation,
}

/// The monitor list the consistency check trusts, or `None` when it failed to load or came
/// back empty: then nothing is closed, because every incident would look deleted.
pub fn known_checks<E>(
    checks: Result<Vec<(String, CheckStatus)>, E>,
) -> Option<HashMap<String, CheckStatus>> {
    let checks = checks.ok()?;
    if checks.is_empty() {
        return None;
    }
    Some(checks.into_iter().collect())
}

/// Plans the consistency check over every stored ongoing incident. Paused checks are left
/// alone so their incident continues on resume.
pub fn plan_consistency_check(
    known: &HashMap<String, CheckStatus>,
    stored: Vec<IncidentSeed>,
    memory: impl Fn(&str) -> Option<IncidentSnapshot>,
) -> Vec<CheckPlan> {
    let mut by_check: BTreeMap<String, Vec<IncidentSeed>> = BTreeMap::new();
    for seed in stored {
        by_check.entry(seed.check_id.clone()).or_default().push(seed);
    }

    by_check
        .into_iter()
        .filter_map(|(check_id, seeds)| match known.get(&check_id) {
            None => Some(CheckPlan {
                check_id,
                deleted: true,
                reconciliation: Reconciliation {
                    close: seeds,
                    ..Default::default()
                },
            }),
            Some(CheckStatus::Paused) => None,
            Some(CheckStatus::Active) => {
                let reconciliation = reconcile(memory(&check_id).as_ref(), seeds);
                (!reconciliation.is_empty()).then_some(CheckPlan {
                    check_id,
                    deleted: false,
                    reconciliation,
                })
            }
        })
        .collect()
}

/// A paused or resumed stretch of a monitor. `resumed_at` is `None` while still paused.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PausePeriod {
    pub paused_at: DateTime<Utc>,
    pub resumed_at: Option<DateTime<Utc>>,
}

/// The part of `start..end` the monitor was not paused for.
pub fn unpaused_duration(start: DateTime<Utc>, end: DateTime<Utc>, pauses: &[PausePeriod]) -> Duration {
    if end <= start {
        return Duration::zero();
    }

    let mut clipped: Vec<(DateTime<Utc>, DateTime<Utc>)> = pauses
        .iter()
        .map(|p| (p.paused_at.max(start), p.resumed_at.unwrap_or(end).min(end)))
        .filter(|(from, to)| from < to)
        .collect();
    clipped.sort();

    let mut paused = Duration::zero();
    let mut covered_until = start;
    for (from, to) in clipped {
        let from = from.max(covered_until);
        if to > from {
            paused += to - from;
            covered_until = to;
        }
    }

    (end - start) - paused
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;
    use uuid::Uuid;

    use crate::monitor::incident::IncidentSeverity;
    use crate::monitor::{MonitorStatus, ReasonCode};

    fn at(hour: u32) -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 2, 21, 0, 0, 0).unwrap() + Duration::hours(hour as i64)
    }

    fn seed(check_id: &str, id: u128, started: u32, last_event: u32) -> IncidentSeed {
        IncidentSeed {
            check_id: check_id.to_string(),
            site_id: "site".to_string(),
            kind: "https".to_string(),
            incident_id: Uuid::from_u128(id),
            state: IncidentState::Ongoing,
            severity: IncidentSeverity::Critical,
            started_at: at(started),
            last_event_at: at(last_event),
            resolved_at: None,
            failure_count: 3,
            last_status: Some(MonitorStatus::Failed),
            reason_code: ReasonCode::HttpTimeout,
            status_code: None,
            notified_down_at: None,
            notified_resolve_at: None,
            last_ssl_milestone_notified: None,
        }
    }

    fn memory(id: u128, state: IncidentState, resolved_at: Option<u32>) -> IncidentSnapshot {
        IncidentSnapshot {
            incident_id: Some(Uuid::from_u128(id)),
            state,
            severity: IncidentSeverity::Critical,
            started_at: Some(at(0)),
            last_event_at: Some(at(resolved_at.unwrap_or(0))),
            resolved_at: resolved_at.map(at),
            failure_count: 3,
            last_status: Some(MonitorStatus::Failed),
            last_error_reason_code: Some(ReasonCode::HttpTimeout),
            last_error_status_code: None,
        }
    }

    fn ids(seeds: &[IncidentSeed]) -> Vec<u128> {
        seeds.iter().map(|s| s.incident_id.as_u128()).collect()
    }

    #[test]
    fn continues_the_stored_ongoing_incident_when_memory_has_none() {
        let plan = reconcile(None, vec![seed("c", 1, 0, 5)]);

        assert_eq!(plan.adopt.map(|s| s.incident_id.as_u128()), Some(1));
        assert!(plan.close.is_empty());
        assert!(plan.lost_resolution.is_none());
    }

    #[test]
    fn keeps_the_most_recent_failed_check_and_closes_older_duplicates() {
        // The prod case: one incident from Feb 21, a stale one from Feb 27.
        let plan = reconcile(None, vec![seed("c", 1, 0, 200), seed("c", 2, 144, 190)]);

        assert_eq!(plan.adopt.map(|s| s.incident_id.as_u128()), Some(1));
        assert_eq!(ids(&plan.close), vec![2]);
    }

    #[test]
    fn closes_every_stored_incident_but_the_one_memory_continues() {
        let memory = memory(2, IncidentState::Ongoing, None);
        let plan = reconcile(Some(&memory), vec![seed("c", 1, 0, 9), seed("c", 2, 3, 5)]);

        assert!(plan.adopt.is_none());
        assert_eq!(ids(&plan.close), vec![1]);
    }

    #[test]
    fn flags_a_stored_incident_memory_already_resolved_as_a_lost_resolution() {
        let memory = memory(1, IncidentState::Resolved, Some(6));
        let plan = reconcile(Some(&memory), vec![seed("c", 1, 0, 5)]);

        assert_eq!(plan.lost_resolution.map(|s| s.incident_id.as_u128()), Some(1));
        assert!(plan.adopt.is_none());
        assert!(plan.close.is_empty());
    }

    #[test]
    fn closes_stored_incidents_older_than_memorys_last_resolution() {
        let memory = memory(1, IncidentState::Resolved, Some(6));
        let plan = reconcile(Some(&memory), vec![seed("c", 2, 0, 4), seed("c", 3, 7, 8)]);

        assert_eq!(ids(&plan.close), vec![2]);
        assert_eq!(plan.adopt.map(|s| s.incident_id.as_u128()), Some(3));
    }

    #[test]
    fn warm_up_keeps_the_most_recent_failed_check_per_check() {
        let seeds = vec![seed("a", 1, 0, 9), seed("a", 2, 3, 4), seed("b", 3, 0, 1)];
        let mut kept: Vec<_> = newest_per_check(&seeds)
            .into_iter()
            .map(|s| (s.check_id, s.incident_id.as_u128()))
            .collect();
        kept.sort();

        assert_eq!(kept, vec![("a".to_string(), 1), ("b".to_string(), 3)]);
    }

    #[test]
    fn warm_up_is_deterministic_whatever_the_load_order() {
        let forward = newest_per_check(&[seed("a", 1, 0, 9), seed("a", 2, 3, 4)]);
        let backward = newest_per_check(&[seed("a", 2, 3, 4), seed("a", 1, 0, 9)]);

        assert_eq!(forward[0].incident_id, backward[0].incident_id);
    }

    fn known(entries: &[(&str, CheckStatus)]) -> HashMap<String, CheckStatus> {
        entries.iter().map(|(id, s)| (id.to_string(), *s)).collect()
    }

    #[test]
    fn consistency_check_closes_deleted_monitors_incidents_at_their_last_failed_check() {
        let plans = plan_consistency_check(
            &known(&[("live", CheckStatus::Active)]),
            vec![seed("deleted", 1, 0, 5), seed("deleted", 2, 1, 3)],
            |_| None,
        );

        assert_eq!(plans.len(), 1);
        assert!(plans[0].deleted);
        assert_eq!(plans[0].check_id, "deleted");
        let mut closed = ids(&plans[0].reconciliation.close);
        closed.sort();
        assert_eq!(closed, vec![1, 2]);
        assert!(plans[0].reconciliation.adopt.is_none());

        let row = crate::monitor::incident::MonitorIncidentRow::closed_from_seed(&plans[0].reconciliation.close[0]);
        assert_eq!(row.state, IncidentState::Resolved);
        assert_eq!(row.resolved_at, Some(row.last_event_at));
        assert_eq!(row.notified_resolve_at, None);
    }

    #[test]
    fn consistency_check_leaves_paused_monitors_incidents_open() {
        let plans = plan_consistency_check(
            &known(&[("paused", CheckStatus::Paused)]),
            vec![seed("paused", 1, 0, 5), seed("paused", 2, 1, 3)],
            |_| None,
        );

        assert!(plans.is_empty());
    }

    #[test]
    fn consistency_check_closes_duplicates_and_lost_resolutions_of_active_monitors() {
        let plans = plan_consistency_check(
            &known(&[("dup", CheckStatus::Active), ("resolved", CheckStatus::Active), ("ok", CheckStatus::Active)]),
            vec![
                seed("dup", 1, 0, 9),
                seed("dup", 2, 3, 4),
                seed("resolved", 3, 0, 5),
                seed("ok", 4, 0, 5),
            ],
            |check_id| match check_id {
                "dup" => Some(memory(1, IncidentState::Ongoing, None)),
                "resolved" => Some(memory(3, IncidentState::Resolved, Some(6))),
                "ok" => Some(memory(4, IncidentState::Ongoing, None)),
                _ => None,
            },
        );

        assert_eq!(plans.len(), 2);
        assert_eq!(plans[0].check_id, "dup");
        assert_eq!(ids(&plans[0].reconciliation.close), vec![2]);
        assert_eq!(plans[1].check_id, "resolved");
        assert_eq!(plans[1].reconciliation.lost_resolution.as_ref().map(|s| s.incident_id.as_u128()), Some(3));
    }

    #[test]
    fn consistency_check_trusts_no_monitor_list_that_failed_or_is_empty() {
        assert!(known_checks::<&str>(Err("postgres down")).is_none());
        assert!(known_checks::<&str>(Ok(vec![])).is_none());
        assert!(known_checks::<&str>(Ok(vec![("a".to_string(), CheckStatus::Active)])).is_some());
    }

    #[test]
    fn downtime_leaves_out_paused_time() {
        let pauses = [
            PausePeriod { paused_at: at(2), resumed_at: Some(at(4)) },
            PausePeriod { paused_at: at(3), resumed_at: Some(at(5)) },
            PausePeriod { paused_at: at(9), resumed_at: None },
        ];

        assert_eq!(unpaused_duration(at(0), at(10), &pauses), Duration::hours(6));
        assert_eq!(unpaused_duration(at(0), at(10), &[]), Duration::hours(10));
        assert_eq!(unpaused_duration(at(6), at(8), &pauses), Duration::hours(2));
    }

    #[test]
    fn downtime_ignores_pauses_outside_the_incident() {
        let pauses = [PausePeriod { paused_at: at(0), resumed_at: Some(at(1)) }];

        assert_eq!(unpaused_duration(at(2), at(3), &pauses), Duration::hours(1));
    }
}
