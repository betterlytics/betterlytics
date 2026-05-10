use axum::{Router, routing::post};

pub fn import_routes() -> Router {
    Router::new()
        .route("/ga4/import", post(crate::handlers::ga4::start_import))
        .route("/ga4/import/:job_id", post(crate::handlers::ga4::get_import_status))
}
