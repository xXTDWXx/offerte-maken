/* PV uses a separate, memory-only admin session. Closing always locks it again. */
(() => {
  'use strict';
  const PAGE_SIZE = 30;
  const FETCH_SIZE = 200;
  const SESSION_MS = 15 * 60 * 1000;
  const zone = 'Europe/Brussels';
  const money = cents => euro(cents / 100);
  const dayKey = date => new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
  const dateLabel = key => new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(key + 'T12:00:00Z'));

  // Calendar arithmetic is UTC-based; range boundaries are Brussels midnights,
  // so a DST Sunday correctly contains 23 or 25 hours.
  function addDays(key, count) {
    const date = new Date(key + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + count);
    return date.toISOString().slice(0, 10);
  }
  function midnight(key) {
    const target = Date.parse(key + 'T00:00:00Z');
    let timestamp = target;
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    for (let i = 0; i < 3; i++) {
      const p = Object.fromEntries(formatter.formatToParts(timestamp).map(x => [x.type, x.value]));
      const represented = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
      timestamp += target - represented;
    }
    return new Date(timestamp).toISOString();
  }
  function validDay(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
      && !Number.isNaN(Date.parse(value + 'T12:00:00Z'))
      && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
  }

  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="pv-login" id="pvLogin" aria-labelledby="pvLoginTitle">
      <form id="pvLoginForm">
        <h2 id="pvLoginTitle">PV overzicht</h2>
        <p>Vul het wachtwoord van voorraadbeheer in.</p>
        <div class="pv-field">
          <label for="pvPassword">Wachtwoord</label>
          <input id="pvPassword" type="password" autocomplete="current-password" required />
        </div>
        <div id="pvLoginStatus" class="pv-login-status" role="status"></div>
        <div class="pv-login-actions">
          <button type="button" class="btn" id="pvCancel">Annuleren</button>
          <button type="submit" class="btn btn-primary" id="pvLoginSubmit">Open overzicht</button>
        </div>
      </form>
    </dialog>
    <section class="pv-overview" id="pvOverview" hidden aria-labelledby="pvTitle">
      <header class="pv-header">
        <h1 id="pvTitle" tabindex="-1">PV overzicht</h1>
        <button type="button" class="btn" id="pvClose">Terug naar kassa · vergrendelen</button>
      </header>
      <div class="pv-shell">
        <form class="pv-filters" id="pvFilters">
          <div class="pv-field"><label for="pvPeriod">Periode</label>
            <select id="pvPeriod">
              <option value="month">Maand</option><option value="week">Week</option>
              <option value="custom">Aangepaste periode</option><option value="all">Alle datums</option>
            </select>
          </div>
          <div class="pv-field" id="pvMonthField"><label for="pvMonth">Maand selecteren</label><input type="month" id="pvMonth" /></div>
          <div class="pv-field" id="pvWeekField" hidden><label for="pvWeek">Dag in de gewenste week</label><input type="date" id="pvWeek" /></div>
          <div class="pv-field" id="pvFromField" hidden><label for="pvFrom">Van</label><input type="date" id="pvFrom" /></div>
          <div class="pv-field" id="pvToField" hidden><label for="pvTo">Tot en met</label><input type="date" id="pvTo" /></div>
          <div class="pv-field"><label for="pvShowroom">Showroom</label>
            <select id="pvShowroom"><option value="">Alle showrooms</option><option value="gent">Gent</option><option value="brugge">Brugge</option></select>
          </div>
          <button class="btn btn-primary" type="submit">Toon verkopen</button>
        </form>
        <div id="pvStatus" class="pv-status" role="status"></div>
        <div id="pvResults" hidden>
          <div id="pvSummary" class="pv-summary"></div>
          <p id="pvMissingPayment" class="pv-note" hidden>Bij sommige verkopen is de betaalwijze niet geregistreerd.</p>
          <div id="pvSales"></div>
          <nav id="pvPagination" class="pv-pagination" aria-label="Verkooppagina's">
            <button class="btn" id="pvPrev" type="button">Vorige</button>
            <span id="pvPageInfo" aria-live="polite"></span>
            <button class="btn" id="pvNext" type="button">Volgende</button>
          </nav>
        </div>
      </div>
    </section>`);

  const ids = ['Login', 'LoginForm', 'Password', 'LoginStatus', 'LoginSubmit', 'Cancel',
    'Overview', 'Title', 'Close', 'Filters', 'Period', 'Month', 'Week', 'From', 'To',
    'MonthField', 'WeekField', 'FromField', 'ToField', 'Showroom', 'Status',
    'Results', 'Summary', 'MissingPayment', 'Sales', 'Pagination', 'Prev', 'Next', 'PageInfo'];
  const ui = Object.fromEntries(ids.map(id => [id, document.getElementById('pv' + id)]));
  let client = null;
  let sales = [];
  let page = 0;
  let generation = 0;
  let timer = null;
  let controller = null;

  function disposeClient(oldClient) {
    if (oldClient) void oldClient.auth.signOut({ scope: 'local' }).catch(() => {});
  }
  function clearAccess() {
    generation++;
    clearTimeout(timer);
    controller?.abort();
    controller = null;
    const oldClient = client;
    client = null;
    disposeClient(oldClient);
    sales = [];
    ui.Password.value = '';
    ui.Results.hidden = true;
    ui.Sales.replaceChildren();
    ui.Summary.replaceChildren();
  }
  function closeOverview() {
    clearAccess();
    ui.Login.close();
    ui.Overview.hidden = true;
    els.app.hidden = false;
    document.getElementById('pvOpenBtn').focus();
  }
  function openLogin(message = '') {
    clearAccess();
    ui.LoginForm.reset();
    ui.LoginSubmit.disabled = false;
    ui.LoginStatus.textContent = message;
    ui.LoginStatus.classList.toggle('error', Boolean(message));
    ui.Login.showModal();
    ui.Password.focus();
  }
  document.getElementById('pvOpenBtn').addEventListener('click', () => openLogin());
  ui.Cancel.addEventListener('click', closeOverview);
  ui.Close.addEventListener('click', closeOverview);
  ui.Login.addEventListener('cancel', event => { event.preventDefault(); closeOverview(); });
  window.addEventListener('pagehide', clearAccess);
  window.addEventListener('pageshow', event => {
    if (event.persisted && (!ui.Overview.hidden || ui.Login.open)) closeOverview();
  });

  ui.LoginForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (ui.LoginSubmit.disabled) return;
    const password = ui.Password.value;
    if (!password) return;
    const attempt = ++generation;
    ui.LoginSubmit.disabled = true;
    ui.LoginStatus.classList.remove('error');
    ui.LoginStatus.textContent = 'Wachtwoord controleren…';
    let candidate;
    try {
      if (!window.supabase?.createClient || STOCK_BACKEND.mode !== 'supabase') {
        throw new Error('De verbinding is niet beschikbaar. Probeer opnieuw.');
      }
      candidate = window.supabase.createClient(STOCK_BACKEND.supabaseUrl, STOCK_BACKEND.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'sunspa-pv-session' }
      });
      const { data, error } = await candidate.auth.signInWithPassword({ email: ADMIN_LOGIN.email, password });
      if (error || !data?.user) throw new Error('Aanmelden mislukt. Controleer je wachtwoord en probeer opnieuw.');
      if (attempt !== generation) return;
      const member = await candidate.from('kassa_admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
      if (member.error || !member.data) throw new Error('Dit account heeft geen toegang tot het PV overzicht.');
      if (attempt !== generation) return;
      client = candidate;
      ui.Password.value = '';
      ui.Login.close();
      els.app.hidden = true;
      ui.Overview.hidden = false;
      ui.Title.focus();
      const today = dayKey(new Date());
      ui.Period.value = 'month';
      ui.Month.value = today.slice(0, 7);
      ui.Week.value = today;
      ui.From.value = today.slice(0, 7) + '-01';
      ui.To.value = today;
      ui.Showroom.value = '';
      updateFields();
      timer = setTimeout(() => {
        closeOverview();
        openLogin('Het overzicht is na 15 minuten vergrendeld. Meld opnieuw aan.');
      }, SESSION_MS);
      await loadSales();
    } catch (error) {
      if (attempt === generation) {
        ui.LoginStatus.textContent = error.message || 'Aanmelden mislukt. Probeer opnieuw.';
        ui.LoginStatus.classList.add('error');
        ui.Password.value = '';
        ui.Password.focus();
      }
    } finally {
      if (candidate !== client) disposeClient(candidate);
      if (attempt === generation) ui.LoginSubmit.disabled = false;
    }
  });

  function updateFields() {
    ui.MonthField.hidden = ui.Period.value !== 'month';
    ui.WeekField.hidden = ui.Period.value !== 'week';
    ui.FromField.hidden = ui.ToField.hidden = ui.Period.value !== 'custom';
  }
  ui.Period.addEventListener('change', updateFields);
  ui.Filters.addEventListener('submit', event => { event.preventDefault(); void loadSales(); });

  function selectedRange() {
    let from, to;
    if (ui.Period.value === 'month') {
      from = ui.Month.value + '-01';
      if (!validDay(from)) throw new Error('Selecteer een geldige maand.');
      const next = new Date(from + 'T12:00:00Z');
      next.setUTCMonth(next.getUTCMonth() + 1);
      to = addDays(next.toISOString().slice(0, 10), -1);
    } else if (ui.Period.value === 'week') {
      if (!validDay(ui.Week.value)) throw new Error('Selecteer een dag in de gewenste week.');
      const weekday = new Date(ui.Week.value + 'T12:00:00Z').getUTCDay();
      from = addDays(ui.Week.value, -((weekday + 6) % 7));
      to = addDays(from, 6);
    } else if (ui.Period.value === 'custom') {
      from = ui.From.value;
      to = ui.To.value;
      if (!validDay(from) || !validDay(to)) throw new Error('Vul een geldige begin- en einddatum in.');
      if (from > to) throw new Error('De einddatum moet op of na de begindatum liggen.');
    }
    return { from, to, showroom: ui.Showroom.value };
  }

  async function loadSales() {
    if (!client) return;
    controller?.abort();
    const request = new AbortController();
    controller = request;
    const activeClient = client;
    const activeGeneration = generation;
    ui.Results.hidden = true;
    ui.Sales.replaceChildren();
    ui.Summary.replaceChildren();
    sales = [];
    ui.Status.classList.remove('error');
    ui.Status.textContent = 'Verkopen laden…';
    try {
      const range = selectedRange();
      const snapshot = new Date().toISOString();
      const requestedUpper = range.to ? midnight(addDays(range.to, 1)) : snapshot;
      const upper = requestedUpper < snapshot ? requestedUpper : snapshot;
      const lower = range.from ? midnight(range.from) : null;
      const loaded = [];
      // Read every page explicitly: Supabase otherwise caps report totals.
      for (let offset = 0; ; offset += FETCH_SIZE) {
        let query = activeClient.from('showroom_stock_sales').select('id,showroom,sold_at,payment_method')
          .order('sold_at', { ascending: false }).order('id', { ascending: true })
          .lt('sold_at', upper).range(offset, offset + FETCH_SIZE - 1).abortSignal(request.signal);
        if (lower) query = query.gte('sold_at', lower);
        if (range.showroom) query = query.eq('showroom', range.showroom);
        const { data, error } = await query;
        if (error) throw error;
        if (request.signal.aborted || generation !== activeGeneration) return;
        loaded.push(...data);
        if (data.length < FETCH_SIZE) break;
      }
      const byId = new Map(loaded.map(sale => [sale.id, { ...sale, items: [], cents: 0 }]));
      for (let start = 0; start < loaded.length; start += FETCH_SIZE) {
        const saleIds = loaded.slice(start, start + FETCH_SIZE).map(sale => sale.id);
        for (let offset = 0; ; offset += FETCH_SIZE) {
          const { data, error } = await activeClient.from('showroom_stock_sale_items')
            .select('id,sale_id,product_title,quantity,unit_price')
            .in('sale_id', saleIds).order('id').range(offset, offset + FETCH_SIZE - 1).abortSignal(request.signal);
          if (error) throw error;
          if (request.signal.aborted || generation !== activeGeneration) return;
          data.forEach(item => {
            const sale = byId.get(item.sale_id);
            const cents = Math.round(Number(item.unit_price) * 100) * Number(item.quantity);
            sale.items.push({ ...item, cents });
            sale.cents += cents;
          });
          if (data.length < FETCH_SIZE) break;
        }
      }
      if (request.signal.aborted || generation !== activeGeneration) return;
      sales = [...byId.values()];
      page = 0;
      const label = range.from ? dateLabel(range.from) + ' t/m ' + dateLabel(range.to) : 'Alle datums';
      ui.Status.textContent = label + ' · ' + (SHOWROOMS[range.showroom] || 'Alle showrooms') + ' · ' + sales.length + ' verkopen';
      ui.Results.hidden = false;
      renderSummary();
      renderPage();
    } catch (error) {
      if (request.signal.aborted || generation !== activeGeneration) return;
      ui.Status.classList.add('error');
      ui.Status.textContent = error instanceof Error ? error.message : 'Verkopen konden niet geladen worden. Probeer opnieuw of meld opnieuw aan.';
    }
  }

  function renderSummary() {
    const total = sales.reduce((sum, sale) => sum + sale.cents, 0);
    const byPayment = method => sales.filter(sale => sale.payment_method === method).reduce((sum, sale) => sum + sale.cents, 0);
    const cards = [['Totaal verkopen', money(total)], ['Aantal verkopen', String(sales.length)],
      ['Bancontact', money(byPayment('Bancontact'))], ['Overschrijving', money(byPayment('Overschrijving'))]];
    const unknown = sales.filter(sale => !sale.payment_method);
    if (unknown.length) cards.push(['Betaalwijze niet geregistreerd', money(unknown.reduce((sum, sale) => sum + sale.cents, 0))]);
    ui.Summary.innerHTML = cards.map(([label, value]) => '<div class="pv-stat"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>').join('');
    ui.MissingPayment.hidden = !unknown.length;
  }

  function renderPage() {
    let previousDay = '';
    const content = sales.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(sale => {
      const date = new Date(sale.sold_at);
      const day = dayKey(date);
      const heading = day !== previousDay ? '<h2 class="pv-day">' + escapeHtml(dateLabel(day)) + '</h2>' : '';
      previousDay = day;
      const time = new Intl.DateTimeFormat('nl-BE', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(date);
      const rows = sale.items.map(item => `<tr>
        <td>${escapeHtml(item.product_title)}</td><td class="number">${escapeHtml(item.quantity)}</td>
        <td class="number">${money(Math.round(Number(item.unit_price) * 100))}</td><td class="number">${money(item.cents)}</td>
      </tr>`).join('');
      return heading + `<article class="pv-sale">
        <div class="pv-sale-head"><div class="pv-sale-meta">
          <h3>${escapeHtml(time)} · ${escapeHtml(SHOWROOMS[sale.showroom] || sale.showroom)}</h3>
          <span class="pv-payment ${sale.payment_method ? '' : 'unknown'}">${escapeHtml(sale.payment_method || 'Niet geregistreerd')}</span>
        </div><strong class="pv-sale-total">${money(sale.cents)}</strong></div>
        <table class="pv-table" aria-label="Producten van verkoop ${escapeHtml(time)}">
          <thead><tr><th scope="col">Product</th><th scope="col" class="number">Aantal</th><th scope="col" class="number">Prijs/stuk</th><th scope="col" class="number">Totaal</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">Geen productregels beschikbaar.</td></tr>'}</tbody>
        </table>
        <div class="pv-reference">Verkoop ${escapeHtml(sale.id)}</div>
      </article>`;
    }).join('');
    ui.Sales.innerHTML = content || '<p class="pv-note">Geen verkopen gevonden voor deze periode en showroom.</p>';
    const pages = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
    ui.Pagination.hidden = sales.length <= PAGE_SIZE;
    ui.PageInfo.textContent = 'Pagina ' + (page + 1) + ' van ' + pages;
    ui.Prev.disabled = page === 0;
    ui.Next.disabled = page >= pages - 1;
  }
  ui.Prev.addEventListener('click', () => { if (page > 0) { page--; renderPage(); ui.Status.scrollIntoView(); } });
  ui.Next.addEventListener('click', () => { if ((page + 1) * PAGE_SIZE < sales.length) { page++; renderPage(); ui.Status.scrollIntoView(); } });
})();
