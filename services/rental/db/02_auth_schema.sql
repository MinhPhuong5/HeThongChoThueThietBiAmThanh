-- Run once against the rental database created in 01_create_database.sql.
BEGIN;

DO $$
BEGIN
    IF current_database() <> 'rental' THEN
        RAISE EXCEPTION 'Connect to the rental database before running this script';
    END IF;
END;
$$;

CREATE TABLE public.users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(12) NOT NULL DEFAULT 'CUSTOMER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_gmail_normalized CHECK (
        email = lower(email) AND email ~ '^[^[:space:]@]+@gmail[.]com$'
    ),
    CONSTRAINT users_password_hash_present CHECK (length(password_hash) > 0),
    CONSTRAINT users_role_valid CHECK (role IN ('CUSTOMER', 'STAFF'))
);

CREATE TABLE public.auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT auth_sessions_token_hash_valid CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT auth_sessions_expiry_valid CHECK (expires_at > created_at)
);

CREATE INDEX auth_sessions_user_idx ON public.auth_sessions (user_id);
CREATE INDEX auth_sessions_expiry_idx ON public.auth_sessions (expires_at);

CREATE TABLE public.rate_limit_buckets (
    scope_key TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
    PRIMARY KEY (scope_key, window_start)
);

CREATE INDEX rate_limit_buckets_window_idx ON public.rate_limit_buckets (window_start);

COMMIT;
