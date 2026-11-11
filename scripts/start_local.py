import sys
import time
import webbrowser
from threading import Thread

import uvicorn
from psycopg import OperationalError, errors

from services.rental.src import db

URL = 'http://127.0.0.1:8000/'


def check_database():
    with db.connect() as connection:
        connection.execute('SELECT user_id FROM public.users LIMIT 1')
        connection.execute('SELECT session_id FROM public.auth_sessions LIMIT 1')
        connection.execute('SELECT scope_key FROM public.rate_limit_buckets LIMIT 1')


def open_when_ready(server):
    for _ in range(100):
        if server.started:
            webbrowser.open(URL)
            return
        time.sleep(.1)


def main():
    try:
        check_database()
    except (OperationalError, errors.UndefinedTable, errors.InsufficientPrivilege) as error:
        print(f'Database connection or schema check failed: {error}', file=sys.stderr)
        print('Check .env or the PostgreSQL environment variables. See README.md for setup.', file=sys.stderr)
        return 1

    server = uvicorn.Server(uvicorn.Config('services.rental.src.app:app', host='127.0.0.1',
                                          port=8000, proxy_headers=False))
    Thread(target=open_when_ready, args=(server,), daemon=True).start()
    server.run()
    return 0 if server.started else 1


if __name__ == '__main__':
    sys.exit(main())
