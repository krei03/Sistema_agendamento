const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const CDP = require('chrome-remote-interface');

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:3000/';
const port = Number(process.env.RESPONSIVE_DEBUG_PORT) || 9300 + Math.floor(Math.random() * 1000);
const outputDir = path.join(process.cwd(), 'tmp', 'responsive');

const viewports = [
  { name: 'desktop', width: 1440, height: 1100, mobile: false },
  { name: 'mobile', width: 390, height: 1200, mobile: true },
];

const dashboardAppointments = [
  { id: 1, customerName: 'Cliente Pendente', customerPhone: '(11) 99999-0001', serviceName: 'Corte Classico', date: new Date().toISOString().slice(0, 10), time: '09:00', status: 'pending' },
  { id: 2, customerName: 'Cliente Confirmado', customerPhone: '(11) 99999-0002', serviceName: 'Corte + Barba', date: new Date().toISOString().slice(0, 10), time: '10:30', status: 'confirmed' },
  { id: 3, customerName: 'Cliente Negado', customerPhone: '(11) 99999-0003', serviceName: 'Barba', date: '2026-05-20', time: '14:00', status: 'rejected' },
  { id: 4, customerName: 'Cliente Concluido', customerPhone: '(11) 99999-0004', serviceName: 'Pacote Deluxe', date: '2026-05-21', time: '16:00', status: 'completed' },
];

const pages = [
  {
    name: 'landing',
    path: '/',
    mockApi: true,
    selectors: ['.hero', '.hero-title', '.hero-copy', '#agenda', '.booking-grid', '.service-card', '#appointmentForm'],
  },
  {
    name: 'dashboard',
    path: '/dashboard.html',
    mockApi: true,
    requiresAuth: true,
    selectors: ['.dashboard-page', '.dashboard-main', '.dashboard-card', '.dashboard-table-wrap', '.appointment-actions'],
  },
];

function browserPath() {
  const candidates = [
    process.env.BROWSER_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      return require('fs').existsSync(candidate);
    } catch {
      return false;
    }
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBrowser(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      return await CDP.Version({ port });
    } catch {
      // Browser is still starting.
    }
    await delay(200);
  }
  throw new Error(`Nao foi possivel acessar Chrome DevTools na porta ${port}`);
}

async function openPage() {
  const response = await fetch(`${baseUrl}?responsiveValidation=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`A landing respondeu HTTP ${response.status}`);
  }
}

function pageUrl(page, viewport) {
  const url = new URL(page.path, baseUrl);
  url.searchParams.set('viewport', viewport.name);
  url.searchParams.set('page', page.name);
  url.searchParams.set('t', Date.now());
  return url.toString();
}

async function validateViewport(client, viewport, page) {
  const { Emulation, Fetch, Page, Runtime } = client;
  await Promise.all([Page.enable(), Runtime.enable()]);
  if (page.mockApi) {
    if (page.requiresAuth) {
      await Page.navigate({ url: new URL('/', baseUrl).toString() });
      await delay(300);
      await Runtime.evaluate({ expression: "localStorage.setItem('barber_token', 'responsive-token');" });
      await Page.addScriptToEvaluateOnNewDocument({
        source: "localStorage.setItem('barber_token', 'responsive-token');",
      });
    }
    await Fetch.enable({ patterns: [{ urlPattern: '*://*/api/*' }] });
    Fetch.requestPaused(async ({ requestId, request }) => {
      let body;
      if (request.url.endsWith('/api/services')) {
        body = {
          services: [
            { id: 1, name: 'Corte Classico', description: 'Corte alinhado para o dia a dia.', durationMinutes: 30, priceCents: 6000 },
            { id: 2, name: 'Barba', description: 'Modelagem e acabamento da barba.', durationMinutes: 20, priceCents: 4500 },
            { id: 3, name: 'Corte + Barba', description: 'Experiencia completa.', durationMinutes: 50, priceCents: 9500 },
          ],
        };
      } else if (request.url.includes('/api/availability')) {
        body = { slots: ['09:00', '09:30', '10:00', '10:30', '14:00'] };
      } else if (request.url.endsWith('/api/appointments')) {
        body = { appointment: { id: 99, status: 'pending' } };
      } else if (request.url.endsWith('/api/barber/me')) {
        body = { barber: { name: 'Administrador', shopName: 'Vieira Barbearia' } };
      } else if (request.url.endsWith('/api/barber/appointments')) {
        body = request.method === 'DELETE'
          ? { deleted: dashboardAppointments.length, message: 'Agenda limpa com sucesso.' }
          : { appointments: dashboardAppointments };
      } else if (request.url.includes('/api/barber/appointments/') && request.url.endsWith('/status')) {
        body = { appointment: { id: 1, status: 'confirmed' } };
      }

      if (!body) {
        await Fetch.continueRequest({ requestId });
        return;
      }

      await Fetch.fulfillRequest({
        requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
        body: Buffer.from(JSON.stringify(body)).toString('base64'),
      });
    });
  }
  await Emulation.setDeviceMetricsOverride({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });
  await Page.navigate({ url: pageUrl(page, viewport) });
  await delay(1500);

  const metrics = await Runtime.evaluate({
    returnByValue: true,
    expression: `(() => {
      const doc = document.documentElement;
      const body = document.body;
      const selectors = ${JSON.stringify(page.selectors)};
      return {
        innerWidth,
        href: location.href,
        title: document.title,
        scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
        elements: selectors.map((selector) => {
          const element = document.querySelector(selector);
          if (!element) return { selector, missing: true };
          const rect = element.getBoundingClientRect();
          return {
            selector,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        }),
      };
    })();`,
  });

  const result = metrics.result.value;
  const overflow = result.scrollWidth - result.innerWidth;
  if (overflow > 1) {
    throw new Error(`${page.name}/${viewport.name}: overflow horizontal de ${overflow}px`);
  }

  for (const element of result.elements) {
    if (element.missing) {
      throw new Error(`${page.name}/${viewport.name}: seletor ausente ${element.selector} em ${result.href} (${result.title})`);
    }
    if (element.left < -1 || element.right > result.innerWidth + 1) {
      throw new Error(`${page.name}/${viewport.name}: ${element.selector} sai da viewport (${element.left}-${element.right} / ${result.innerWidth})`);
    }
  }

  const screenshot = await Page.captureScreenshot({
    format: 'png',
    captureBeyondViewport: false,
  });
  const screenshotPath = path.join(outputDir, `${page.name}-${viewport.name}.png`);
  await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));

  return { ...result, screenshotPath };
}

async function main() {
  await openPage();
  await fs.mkdir(outputDir, { recursive: true });

  const executable = browserPath();
  if (!executable) {
    throw new Error('Chrome/Edge nao encontrado. Defina BROWSER_PATH para validar responsividade.');
  }
  console.log(`Browser: ${executable}`);

  const profileDir = path.join(process.cwd(), 'tmp', `responsive-profile-${Date.now()}`);
  await fs.mkdir(profileDir, { recursive: true });

  const browser = spawn(executable, [
    '--headless=new',
    '--disable-gpu',
    '--disable-crash-reporter',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-allow-origins=*',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    await waitForBrowser();
    const results = [];

    for (const page of pages) {
      for (const viewport of viewports) {
        console.log(`Validando ${page.name}/${viewport.name} (${viewport.width}x${viewport.height})...`);
        const target = await CDP.New({ port, url: 'about:blank' });
        const client = await CDP({ port, target });
        try {
          const result = await validateViewport(client, viewport, page);
          results.push({ page: page.name, viewport: viewport.name, ...result });
        } finally {
          await client.close();
          await CDP.Close({ port, id: target.id });
        }
      }
    }

    for (const result of results) {
      console.log(`${result.page}/${result.viewport}: viewport ${result.innerWidth}px, scroll ${result.scrollWidth}px, screenshot ${result.screenshotPath}`);
    }
  } finally {
    browser.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
