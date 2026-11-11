from pathlib import Path
from string import Template

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from psycopg import OperationalError, errors

from services.rental.src.auth import current_user, router

web = Path(__file__).resolve().parents[3] / 'web'
app = FastAPI(title='EchoRent · Dịch vụ Thuê', docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(router)
app.mount('/assets', StaticFiles(directory=web / 'assets'), name='assets')


@app.middleware('http')
async def protect_requests(request, call_next):
    origin = request.headers.get('Origin')
    expected = f'{request.url.scheme}://{request.url.netloc}'
    if request.method == 'POST' and origin and origin != expected:
        response = JSONResponse({'error': {'code': 'FORBIDDEN', 'message': 'Nguồn yêu cầu không hợp lệ.'}},
                                status_code=403)
    else:
        response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
    )
    return response


@app.exception_handler(HTTPException)
async def http_error(_request, error):
    detail = error.detail if isinstance(error.detail, dict) else {'message': error.detail}
    return JSONResponse({'error': detail}, status_code=error.status_code, headers=error.headers)


@app.exception_handler(RequestValidationError)
async def invalid_request(_request, _error):
    return JSONResponse({'error': {'code': 'VALIDATION_ERROR', 'message': 'Kiểm tra lại Gmail và mật khẩu.'}},
                        status_code=400)


@app.exception_handler(OperationalError)
@app.exception_handler(errors.UndefinedTable)
async def database_unavailable(_request, _error):
    return JSONResponse({'error': {'code': 'DEPENDENCY_UNAVAILABLE', 'message': 'Dịch vụ dữ liệu chưa sẵn sàng.'}},
                        status_code=503)


def render_page(filename, brand_href):
    brand = Template((web / 'brand.html').read_text(encoding='utf-8')).substitute(brand_href=brand_href)
    page = (web / filename).read_text(encoding='utf-8')
    return HTMLResponse(page.replace('<!-- site-brand -->', brand))


@app.get('/')
def login_page():
    return render_page('index.html', '/#login')


@app.get('/home')
def home(request: Request):
    if not current_user(request):
        return RedirectResponse('/#login', status_code=303)
    return render_page('home.html', '/home')
