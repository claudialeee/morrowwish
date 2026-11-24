-- Additive only. No DELETE, DROP, reset, backup restore or event mutation.
CREATE INDEX IF NOT EXISTS idx_events_category_ts_id ON events(category,ts DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_events_diagnostic_view ON events(category,view_id) WHERE category='diagnostic';
CREATE INDEX IF NOT EXISTS idx_events_catbond_visits_day ON events(category,game,kind,day) WHERE category='arcade' AND game='cat-bond' AND kind='visit';
