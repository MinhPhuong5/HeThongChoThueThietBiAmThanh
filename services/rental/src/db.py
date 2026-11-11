import os
from pathlib import Path

import psycopg
from dotenv import dotenv_values
from psycopg.rows import dict_row

local_config = dotenv_values(Path(__file__).resolve().parents[3] / '.env', interpolate=False, encoding='utf-8-sig')


def setting(name, default=None):
    return os.getenv(name, local_config.get(name) or default)


def connect():
    return psycopg.connect(
        host=setting('PGHOST', '127.0.0.1'),
        port=setting('PGPORT', '5432'),
        dbname=setting('PGDATABASE', 'rental'),
        user=setting('PGUSER', 'postgres'),
        password=setting('PGPASSWORD'),
        sslmode=setting('PGSSLMODE'),
        connect_timeout=4,
        row_factory=dict_row,
    )
