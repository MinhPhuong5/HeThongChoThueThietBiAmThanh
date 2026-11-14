const workspace = document.querySelector('.rental-workspace');
const find = (id) => document.getElementById(id);
const availabilityForm = find('availability-form');
const orderForm = find('order-form');
const submitOrder = orderForm.querySelector('button');
const notice = find('rental-message');
const detail = find('order-detail');
const staffFilter = find('staff-order-filter');
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const vietnamTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' });
const statuses = {
  HOLD_PENDING: 'Đang giữ thiết bị', PAYMENT_PENDING: 'Chờ thanh toán', CONFIRMED: 'Đã xác nhận',
  CLOSE_PENDING: 'Đang xử lý đóng đơn', CANCEL_RELEASE_PENDING: 'Đang giải phóng lịch',
  REJECTED: 'Từ chối', CANCELLED: 'Đã hủy', REFUND_PENDING: 'Chờ hoàn tiền', EXPIRED: 'Hết hạn',
  HANDED_OVER: 'Đã bàn giao', RETURNED: 'Đã hoàn trả', PARTIALLY_RETURNED: 'Đã trả một phần',
  CLOSED_WITH_LOSS: 'Đã đóng, có thiết bị mất', PENDING: 'Chờ thanh toán', UNPAID: 'Chưa thu',
  PAID: 'Đã thu', REFUNDED: 'Đã hoàn tiền', CLOSED_UNPAID: 'Đã đóng khoản phải thu', FAILED: 'Thất bại',
};
const pending = new Set(['HOLD_PENDING', 'PAYMENT_PENDING', 'CLOSE_PENDING', 'REFUND_PENDING', 'CANCEL_RELEASE_PENDING']);
const cancellable = new Set(['PAYMENT_PENDING', 'CONFIRMED']);
const selected = new Map();
const requestKeys = new Map();
let period;
let equipment = [];
let availabilityRequest;
let listRequest;
let detailRequest;
let submitting = false;
let acting = false;
let page = 1;
let total = 0;
const pageSize = 20;
let staff = false;
let orderFilter = {};
let qrTimer;

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content != null) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function button(label, handler, className = 'rental-secondary') {
  const node = element('button', label, className);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
}

function message(content = '', kind = 'error') {
  notice.textContent = content;
  notice.dataset.kind = kind;
  notice.hidden = !content;
}

async function api(path, { body, key, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (key) headers['Idempotency-Key'] = key;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST', headers, signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    location.replace('/#login');
    throw new Error('Phiên đăng nhập đã hết hạn.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Không thể thực hiện yêu cầu. Vui lòng thử lại.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

function showError(error, unavailable) {
  if (error.name === 'AbortError' || error.status === 401) return;
  message(error.status === 404 && unavailable ? unavailable : error.message);
}

function isoTime(value) {
  const time = Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16));
  if (time < 8 * 60 || time > 20 * 60) throw new Error('Giờ nhận và hạn trả phải trong khoảng 08:00–20:00.');
  return new Date(`${value}+07:00`).toISOString();
}

function readPeriod() {
  const values = new FormData(availabilityForm);
  const pickup_at = isoTime(values.get('pickup_at'));
  const due_at = isoTime(values.get('due_at'));
  const duration = Date.parse(due_at) - Date.parse(pickup_at);
  if (Date.parse(pickup_at) < Date.now()) throw new Error('Giờ nhận phải ở trong tương lai.');
  if (duration <= 0 || duration > 30 * 86400000) throw new Error('Hạn trả phải sau giờ nhận và kỳ thuê tối đa 30 ngày.');
  return { pickup_at, due_at, days: Math.ceil(duration / 86400000) };
}

function updateSelection() {
  const container = find('rental-selection');
  container.replaceChildren();
  let amount = 0;
  for (const item of equipment) {
    const quantity = selected.get(item.type) || 0;
    if (!quantity) continue;
    const subtotal = quantity * period.days * item.daily_rate_vnd;
    amount += subtotal;
    const row = element('div', null, 'selection-row');
    row.append(element('span', `${item.name} × ${quantity}`), element('strong', currency.format(subtotal)));
    container.append(row);
  }
  if (!selected.size) container.append(element('p', 'Chưa chọn thiết bị.', 'rental-hint'));
  find('rental-total').textContent = selected.size ? currency.format(amount) : '—';
  submitOrder.disabled = staff || submitting || !selected.size;
}

function resetEquipment() {
  availabilityRequest?.abort();
  period = undefined;
  equipment = [];
  selected.clear();
  find('equipment-list').replaceChildren();
  find('equipment-message').textContent = 'Chọn kỳ thuê để xem thiết bị còn trống.';
  updateSelection();
}

function appendImage(parent, value, description) {
  if (!value) return;
  // EchoRent serves inventory and payment images through the same origin.
  let url;
  try { url = new URL(value, location.origin); } catch { return; }
  if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) return;
  const image = element('img');
  image.alt = description;
  image.addEventListener('error', () => image.remove());
  image.src = url.href;
  parent.append(image);
}

function renderEquipment() {
  find('equipment-message').textContent = equipment.length
    ? `${period.days} ngày tính phí` : 'Không có thiết bị khả dụng trong kỳ đã chọn.';
  for (const item of equipment) {
    const row = element('div', null, 'equipment-row');
    const info = element('div', null, 'equipment-info');
    appendImage(info, item.image_url, item.name);
    info.append(element('strong', item.name), element('span', `${currency.format(item.daily_rate_vnd)} / ngày`, 'rental-hint'),
                element('span', `Còn ${item.available_quantity} thiết bị`, 'rental-hint'));
    const quantity = element('input');
    quantity.type = 'number';
    quantity.min = 0;
    quantity.max = item.available_quantity;
    quantity.step = 1;
    quantity.value = 0;
    quantity.disabled = staff || item.available_quantity === 0;
    quantity.setAttribute('aria-label', `Số lượng ${item.name}`);
    quantity.addEventListener('input', () => {
      const value = quantity.valueAsNumber;
      if (Number.isInteger(value) && value > 0 && value <= item.available_quantity) selected.set(item.type, value);
      else selected.delete(item.type);
      updateSelection();
    });
    row.append(info, quantity);
    find('equipment-list').append(row);
  }
}

availabilityForm.addEventListener('input', resetEquipment);
availabilityForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  resetEquipment();
  message();
  const controller = new AbortController();
  availabilityRequest = controller;
  try {
    const query = readPeriod();
    find('equipment-message').textContent = 'Đang kiểm tra thiết bị…';
    const params = new URLSearchParams({ pickup_at: query.pickup_at, due_at: query.due_at });
    const result = await api(`/equipment?${params}`, { signal: controller.signal });
    if (controller.signal.aborted) return;
    period = query;
    equipment = result.equipment;
    renderEquipment();
  } catch (error) {
    if (controller.signal.aborted) return;
    find('equipment-message').textContent = [404, 503].includes(error.status)
      ? 'Danh mục thiết bị hiện chưa khả dụng.' : error.message;
  }
});

function requestKey(scope, body) {
  const key = requestFingerprint(scope, body);
  if (!requestKeys.has(key)) requestKeys.set(key, crypto.randomUUID());
  return requestKeys.get(key);
}

function requestFingerprint(scope, body) {
  return `${scope}:${JSON.stringify(body)}`;
}

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitOrder.disabled || !period) return;
  submitting = true;
  updateSelection();
  message();
  try {
    const payment_method = find('payment-method').value;
    if (payment_method === 'ONLINE' && Date.parse(period.pickup_at) - Date.now() < 15 * 60000) {
      throw new Error('Thanh toán trực tuyến cần giờ nhận cách hiện tại ít nhất 15 phút.');
    }
    const items = [...selected].sort(([left], [right]) => left.localeCompare(right)).map(([type, quantity]) => ({ type, quantity }));
    const body = { pickup_at: period.pickup_at, due_at: period.due_at, items, payment_method };
    const result = await api('/orders', { body, key: requestKey('order', body) });
    requestKeys.delete(requestFingerprint('order', body));
    resetEquipment();
    location.hash = `lich-thue/${encodeURIComponent(result.id)}`;
  } catch (error) {
    showError(error, 'Chức năng ghi lịch thuê hiện chưa khả dụng.');
  } finally {
    submitting = false;
    updateSelection();
  }
});

function dateLabel(value) {
  return value ? vietnamTime.format(new Date(value)) : '—';
}

function statusLabel(value) {
  return statuses[value] || value || '—';
}

async function loadOrders() {
  listRequest?.abort();
  const controller = new AbortController();
  listRequest = controller;
  const list = find('orders-list');
  list.textContent = 'Đang tải lịch thuê…';
  find('order-pages').hidden = true;
  try {
    const params = new URLSearchParams({ page, page_size: pageSize, ...orderFilter });
    const result = await api(`/orders?${params}`, { signal: controller.signal });
    if (controller.signal.aborted) return;
    total = result.total;
    list.replaceChildren();
    if (!result.items.length) list.textContent = 'Chưa có lịch thuê.';
    for (const order of result.items) {
      const row = element('div', null, 'order-entry');
      const info = element('div');
      info.append(element('strong', `Lượt thuê ${order.id}`),
                  element('p', `${dateLabel(order.pickup_at)} – ${dateLabel(order.due_at)} · ${statusLabel(order.status)}`, 'rental-hint'));
      const link = element('a', 'Xem chi tiết');
      link.href = `#lich-thue/${encodeURIComponent(order.id)}`;
      row.append(info, link);
      list.append(row);
    }
    find('previous-page').disabled = page === 1;
    find('next-page').disabled = page * pageSize >= total;
    find('page-number').textContent = `Trang ${page} / ${Math.max(1, Math.ceil(total / pageSize))}`;
    find('order-pages').hidden = total <= pageSize && page === 1;
  } catch (error) {
    if (controller.signal.aborted || error.name === 'AbortError') return;
    list.textContent = error.status === 404 ? 'Chức năng xem lịch thuê hiện chưa khả dụng.' : error.message;
  }
}

async function loadDetail(id, focus = false) {
  detailRequest?.abort();
  clearTimeout(qrTimer);
  const controller = new AbortController();
  detailRequest = controller;
  detail.hidden = false;
  detail.textContent = 'Đang tải chi tiết…';
  try {
    const order = await api(`/orders/${encodeURIComponent(id)}`, { signal: controller.signal });
    if (controller.signal.aborted) return;
    renderDetail(order);
    if (focus) detail.focus();
  } catch (error) {
    if (!controller.signal.aborted) detail.textContent = error.message;
  }
}

async function orderAction(order, action, body, withKey = false) {
  if (acting) return;
  acting = true;
  message();
  const path = `/orders/${encodeURIComponent(order.id)}/${action}`;
  const buttons = [...detail.querySelectorAll('button:not(:disabled)')];
  for (const control of buttons) control.disabled = true;
  try {
    await api(path, { body, key: withKey ? requestKey(path, body) : undefined });
    if (location.hash === `#lich-thue/${encodeURIComponent(order.id)}`) {
      await Promise.all([loadOrders(), loadDetail(order.id)]);
      message('Đã gửi yêu cầu. Xem trạng thái cập nhật trong chi tiết lượt thuê.', 'success');
    }
  } catch (error) {
    showError(error);
  } finally {
    for (const control of buttons) control.disabled = false;
    acting = false;
  }
}

function confirmCancellation(order, reason) {
  const dialog = element('dialog', null, 'rental-confirm');
  const title = element('h2', reason === 'NO_SHOW' ? 'Đóng lịch do khách không đến?' : 'Hủy lượt thuê này?');
  const controls = element('div', null, 'order-actions');
  const stay = button('Quay lại', () => dialog.close());
  stay.autofocus = true;
  controls.append(stay, button('Xác nhận', () => {
    dialog.close();
    orderAction(order, 'cancel', { reason }, true);
  }, 'rental-primary'));
  dialog.append(title, controls);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  workspace.append(dialog);
  dialog.showModal();
}

function renderDetail(order) {
  detail.replaceChildren(element('h2', `Lượt thuê ${order.id}`));
  const details = [
    `Nhận ${dateLabel(order.pickup_at)} · Trả ${dateLabel(order.due_at)}`,
    `Trạng thái thuê · ${statusLabel(order.status)}`,
    `Thanh toán · ${statusLabel(order.payment_status)}`,
    order.amount_vnd == null ? null : `Tổng tiền · ${currency.format(order.amount_vnd)}`,
  ];
  for (const line of details.filter(Boolean)) detail.append(element('p', line));
  if (order.items?.length) {
    const list = element('ul');
    for (const item of order.items) list.append(element('li', `${item.name || item.type} × ${item.quantity}`));
    detail.append(list);
  }
  const instruction = order.payment;
  if (order.status === 'PAYMENT_PENDING' && instruction?.expires_at && Date.parse(instruction.expires_at) > Date.now()) {
    const payment = element('div');
    if (instruction.payment_code) payment.append(element('p', `Nội dung chuyển khoản · ${instruction.payment_code}`));
    payment.append(element('p', `Hạn thanh toán · ${dateLabel(instruction.expires_at)}`));
    appendImage(payment, instruction.qr_url, 'Mã QR thanh toán');
    detail.append(payment);
    qrTimer = setTimeout(() => {
      payment.textContent = 'Mã thanh toán đã hết hạn. Đối soát để cập nhật trạng thái.';
    }, Date.parse(instruction.expires_at) - Date.now());
  }
  const actions = element('div', null, 'order-actions');
  if (pending.has(order.status)) actions.append(button('Đối soát', () => orderAction(order, 'reconcile', {})));
  if (cancellable.has(order.status)) actions.append(button('Hủy lượt thuê', () => confirmCancellation(order, 'CUSTOMER_CANCEL')));
  if (staff && order.status === 'CONFIRMED' && order.no_show_at && Date.parse(order.no_show_at) <= Date.now()) {
    actions.append(button('Khách không đến', () => confirmCancellation(order, 'NO_SHOW')));
  }
  detail.append(actions);
  if (staff) renderStaffActions(order);
  if (order.history?.length) {
    detail.append(element('h2', 'Lịch sử xử lý'));
    const list = element('ul');
    for (const event of order.history) list.append(element('li', `${dateLabel(event.occurred_at)} · ${event.message || statusLabel(event.status)}`));
    detail.append(list);
  }
}

function renderStaffActions(order) {
  const handedOver = ['HANDED_OVER', 'RETURNED', 'PARTIALLY_RETURNED', 'CLOSED_WITH_LOSS'].includes(order.status);
  if (handedOver && order.payment_method === 'PAY_ON_RECEIPT' && order.payment_status === 'UNPAID' && order.amount_vnd > 0) {
    const form = staffForm('Ghi nhận đã thu', (values) => orderAction(order, 'record-receipt', { amount: Number(values.get('amount')) }));
    const amount = field(form, 'Số tiền đã nhận (VNĐ)', 'amount', 'number');
    amount.min = 1;
    amount.step = 1;
  }
  if (order.status === 'REFUND_PENDING' && order.amount_vnd > 0) {
    const form = staffForm('Xác nhận hoàn tiền', (values) => orderAction(order, 'confirm-refund', {
      reference: values.get('reference').trim(), amount: Number(values.get('amount')),
    }, true));
    field(form, 'Mã giao dịch hoàn tiền', 'reference');
    const amount = field(form, 'Số tiền đã hoàn (VNĐ)', 'amount', 'number');
    amount.min = 1;
    amount.step = 1;
  }
  const handover = order.status === 'CONFIRMED'
    && (order.payment_method === 'PAY_ON_RECEIPT' || order.payment_status === 'PAID')
    && Date.parse(order.pickup_at) <= Date.now() && Date.now() < Date.parse(order.no_show_at);
  if (handover || order.status === 'HANDED_OVER') renderInspection(order, handover);
}

function staffForm(title, handler) {
  const form = element('form');
  const submit = element('button', title, 'rental-primary');
  submit.type = 'submit';
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handler(new FormData(form));
  });
  form.append(element('h2', title), submit);
  detail.append(form);
  return form;
}

function field(form, title, name, type = 'text') {
  const label = element('label', title);
  const input = element('input');
  input.name = name;
  input.type = type;
  input.required = true;
  label.append(input);
  form.insertBefore(label, form.lastElementChild);
  return input;
}

function renderInspection(order, handover) {
  if (!order.assets?.length) {
    detail.append(element('p', 'Danh sách tài sản của lượt thuê hiện chưa khả dụng.', 'rental-hint'));
    return;
  }
  const form = staffForm(handover ? 'Xác nhận bàn giao' : 'Xác nhận hoàn trả', (values) => {
    const items = order.assets.map((asset, index) => handover ? {
      asset_id: asset.asset_id, condition: 'OK', accessories: asset.accessories || [],
    } : {
      asset_id: asset.asset_id, condition: values.get(`condition-${index}`),
      missing_accessory_codes: (asset.accessories || []).filter((_, accessory) => values.has(`missing-${index}-${accessory}`)).map((item) => item.code),
    });
    const body = { items, note: values.get('note').trim() };
    if (!handover) body.operation_id = requestKey(`${order.id}:return`, body);
    orderAction(order, handover ? 'handover' : 'return', body, handover);
  });
  order.assets.forEach((asset, index) => {
    const row = element('fieldset', null, 'asset-form-row');
    row.append(element('legend', asset.asset_id));
    if (handover) {
      const label = element('label', 'Đã kiểm tra thiết bị hoạt động và đủ phụ kiện');
      const checked = element('input');
      checked.type = 'checkbox';
      checked.required = true;
      label.prepend(checked);
      row.append(label);
    } else {
      const label = element('label', 'Tình trạng lúc hoàn trả');
      const condition = element('select');
      condition.name = `condition-${index}`;
      condition.required = true;
      for (const [value, text] of [['', 'Chọn tình trạng'], ['OK', 'Đạt'], ['DAMAGED', 'Hư hỏng']]) {
        const option = element('option', text);
        option.value = value;
        condition.append(option);
      }
      label.append(condition);
      row.append(label);
    }
    (asset.accessories || []).forEach((accessory, accessoryIndex) => {
      if (handover) row.append(element('span', `${accessory.code} × ${accessory.quantity}`));
      else {
        const label = element('label', `Thiếu phụ kiện ${accessory.code}`);
        const check = element('input');
        check.type = 'checkbox';
        check.name = `missing-${index}-${accessoryIndex}`;
        label.prepend(check);
        row.append(label);
      }
    });
    form.insertBefore(row, form.lastElementChild);
  });
  field(form, 'Ghi chú', 'note').required = false;
}

function showRoute() {
  const [, id] = location.hash.slice(1).split('/');
  const orders = location.hash.startsWith('#lich-thue') || staff;
  message();
  find('booking-view').hidden = orders;
  find('orders-view').hidden = !orders;
  find(orders ? 'orders-link' : 'booking-link').setAttribute('aria-current', 'page');
  find(orders ? 'booking-link' : 'orders-link').removeAttribute('aria-current');
  if (orders) {
    loadOrders();
    if (id) loadDetail(id, true);
    else { detailRequest?.abort(); detail.hidden = true; }
  } else {
    listRequest?.abort();
    detailRequest?.abort();
  }
}

find('refresh-orders').addEventListener('click', showRoute);
staffFilter.elements.schedule.addEventListener('change', () => {
  const byDate = ['PICKUP', 'RETURN'].includes(staffFilter.elements.schedule.value);
  find('schedule-date-field').hidden = !byDate;
  staffFilter.elements.date.required = byDate;
});
staffFilter.addEventListener('submit', (event) => {
  event.preventDefault();
  const { schedule, date } = staffFilter.elements;
  orderFilter = schedule.value ? { schedule: schedule.value } : {};
  if (date.required) orderFilter.date = date.value;
  page = 1;
  location.hash = '#lich-thue';
  if (detail.hidden) loadOrders();
});
find('previous-page').addEventListener('click', () => { if (page > 1) { page -= 1; loadOrders(); } });
find('next-page').addEventListener('click', () => { if (page * pageSize < total) { page += 1; loadOrders(); } });
api('/me').then((user) => {
  staff = user.role === 'STAFF';
  find('booking-link').hidden = staff;
  staffFilter.hidden = !staff;
  if (staff) find('orders-title').textContent = 'Lịch thuê';
  window.addEventListener('hashchange', showRoute);
  showRoute();
}).catch((error) => showError(error));
