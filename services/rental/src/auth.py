import hashlib
import re
import secrets
import unicodedata
from datetime import datetime, timezone
from threading import BoundedSemaphore

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field

from services.rental.src.db import connect

router = APIRouter(prefix='/api')
SESSION_COOKIE = 'amkho_session'
SESSION_SECONDS = 1800
GMAIL = re.compile(r"[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com", re.ASCII)
hasher = PasswordHasher()
dummy_hash = hasher.hash(secrets.token_urlsafe())
hash_slots = BoundedSemaphore(4)


class Credentials(BaseModel):
    model_config = ConfigDict(extra='forbid')
    email: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)


def fail(status, code, message, headers=None):
    raise HTTPException(status, {'code': code, 'message': message}, headers)


def normalize_email(value):
    email = value.strip().lower()
    if not GMAIL.fullmatch(email):
        fail(400, 'VALIDATION_ERROR', 'Hãy nhập địa chỉ có đuôi @gmail.com.')
    return email


def limit_attempts(request, action, limit, seconds):
    client = request.client.host if request.client else 'unknown'
    now = int(datetime.now(timezone.utc).timestamp())
    start = now - now % seconds
    with connect() as db:
        attempt = db.execute('''
            INSERT INTO public.rate_limit_buckets (scope_key, window_start, request_count)
            VALUES (%s, %s, 1)
            ON CONFLICT (scope_key, window_start) DO UPDATE
            SET request_count = rate_limit_buckets.request_count + 1
            WHERE rate_limit_buckets.request_count < %s
            RETURNING request_count
        ''', (f'{action}:{client}', datetime.fromtimestamp(start, timezone.utc), limit)).fetchone()
    if not attempt:
        fail(429, 'RATE_LIMITED', 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
             {'Retry-After': str(start + seconds - now)})


def password_operation(operation, *args):
    if not hash_slots.acquire(timeout=.25):
        fail(503, 'DEPENDENCY_UNAVAILABLE', 'Hệ thống đang bận. Vui lòng thử lại.')
    try:
        return operation(*args)
    finally:
        hash_slots.release()


def token_digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


def current_user(request):
    token = request.cookies.get(SESSION_COOKIE, '')
    if len(token) != 43:
        return None
    with connect() as db:
        return db.execute('''
            SELECT users.email, users.role
            FROM public.auth_sessions AS sessions
            JOIN public.users AS users USING (user_id)
            WHERE sessions.token_hash = %s AND sessions.revoked_at IS NULL
              AND sessions.expires_at > CURRENT_TIMESTAMP
              AND users.is_active AND NOT users.must_change_password
        ''', (token_digest(token),)).fetchone()


@router.post('/register', status_code=201)
def register(body: Credentials, request: Request):
    email = normalize_email(body.email)
    password = body.password
    if not (any(ch.islower() for ch in password) and any(ch.isupper() for ch in password)
            and any(ch in '0123456789' for ch in password)
            and any(unicodedata.category(ch)[0] in 'PS' for ch in password)):
        fail(400, 'VALIDATION_ERROR', 'Mật khẩu cần có chữ thường, chữ hoa, số và ký tự đặc biệt.')
    limit_attempts(request, 'register', 5, 900)
    hashed = password_operation(hasher.hash, password)
    with connect() as db:
        user = db.execute('''
            INSERT INTO public.users (email, password_hash, role)
            VALUES (%s, %s, 'CUSTOMER')
            ON CONFLICT (email) DO NOTHING
            RETURNING email, role
        ''', (email, hashed)).fetchone()
    if not user:
        fail(409, 'EMAIL_TAKEN', 'Gmail này đã được đăng ký.')
    return user


@router.post('/login')
def login(body: Credentials, request: Request, response: Response):
    email = normalize_email(body.email)
    limit_attempts(request, 'login', 10, 300)
    with connect() as db:
        user = db.execute('SELECT user_id, password_hash, is_active, must_change_password '
                          'FROM public.users WHERE email = %s', (email,)).fetchone()
    saved_hash = user['password_hash'] if user else dummy_hash
    try:
        password_operation(hasher.verify, saved_hash, body.password)
    except (VerificationError, InvalidHashError):
        fail(401, 'UNAUTHENTICATED', 'Sai tài khoản hoặc mật khẩu.')
    if not user or not user['is_active']:
        fail(401, 'UNAUTHENTICATED', 'Sai tài khoản hoặc mật khẩu.')
    if user['must_change_password']:
        fail(403, 'FORBIDDEN', 'Tài khoản đang dùng mật khẩu tạm. Hãy liên hệ nhân viên.')

    token = secrets.token_urlsafe(32)
    with connect() as db:
        # Recheck the account after verification in case its password or status changed.
        account = db.execute('''
            SELECT email, role FROM public.users
            WHERE user_id = %s AND password_hash = %s AND is_active AND NOT must_change_password
            FOR UPDATE
        ''', (user['user_id'], saved_hash)).fetchone()
        if not account:
            fail(401, 'UNAUTHENTICATED', 'Sai tài khoản hoặc mật khẩu.')
        db.execute('''
            INSERT INTO public.auth_sessions (user_id, token_hash, expires_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP + make_interval(secs => %s))
        ''', (user['user_id'], token_digest(token), SESSION_SECONDS))
    response.set_cookie(SESSION_COOKIE, token, max_age=SESSION_SECONDS, httponly=True,
                        secure=request.url.scheme == 'https', samesite='strict')
    return account


@router.get('/me')
def me(request: Request):
    account = current_user(request)
    if not account:
        fail(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.')
    return account


@router.post('/logout', status_code=204)
def logout(request: Request):
    token = request.cookies.get(SESSION_COOKIE, '')
    if len(token) == 43:
        with connect() as db:
            db.execute('''
                UPDATE public.auth_sessions SET revoked_at = CURRENT_TIMESTAMP
                WHERE token_hash = %s AND revoked_at IS NULL
            ''', (token_digest(token),))
    response = Response(status_code=204)
    response.delete_cookie(SESSION_COOKIE, httponly=True, secure=request.url.scheme == 'https', samesite='strict')
    return response
