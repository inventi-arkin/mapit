// Renders the PNG icons from logo.svg with headless Chrome (tests/automated/harness.js).
// Run: node icons/make-icons.js   (writes into icons/)
const fs = require('fs'), path = require('path');
const { runPage } = require('../tests/automated/harness');
const dir = __dirname;
const svg = fs.readFileSync(path.join(dir, 'logo.svg'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const inner = svg.replace(/^[\s\S]*?<defs>/, '<defs>').replace(/<\/svg>\s*$/, '');
// mark(size, { rounded, iconScale }): rounded = rounded square on transparent; else a full square (iOS / maskable round it themselves)
const mark = (id, size, { rounded = true, iconScale = 1.111 } = {}) =>
  `<svg id="${id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}" style="display:block">` +
  inner.replace('rx="170"', rounded ? 'rx="170"' : 'rx="0"').replace('scale(1.111)', `scale(${iconScale})`).replace(/id="g"/, `id="g-${id}"`).replace('url(#g)', `url(#g-${id})`) + '</svg>';
const page = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;800;900&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:transparent} .item{position:absolute} #og{width:1200px;height:630px;background:linear-gradient(135deg,#f0f7ff 0%,#ffffff 55%,#eef2ff 100%);font-family:Inter,Arial,sans-serif;display:flex;align-items:center;gap:56px;padding:0 96px;box-sizing:border-box}
#og h1{margin:0;font-size:104px;font-weight:900;letter-spacing:-3px;color:#0f172a;line-height:1} #og p{margin:18px 0 0;font-size:38px;font-weight:500;color:#475569} #og .bar{margin-top:34px;height:10px;width:220px;border-radius:9999px;background:linear-gradient(90deg,#0270c7,#4f46e5)}</style></head><body>
<div class="item" style="left:0;top:0">${mark('f32', 32)}</div>
<div class="item" style="left:40px;top:0">${mark('f48', 48)}</div>
<div class="item" style="left:100px;top:0">${mark('t180', 180, { rounded: false })}</div>
<div class="item" style="left:300px;top:0">${mark('a192', 192)}</div>
<div class="item" style="left:0;top:200px">${mark('a512', 512)}</div>
<div class="item" style="left:520px;top:200px">${mark('m512', 512, { rounded: false, iconScale: 0.85 })}</div>
<div class="item" style="left:520px;top:0">${mark('e96', 96)}</div>
<div class="item" style="left:0;top:720px"><div id="og">${mark('og-mark', 240)}<div><h1>Map It</h1><p>Product roadmaps for Inventi</p><div class="bar"></div></div></div></div>
</body></html>`;
const OUT = [['f32', 'favicon-32.png'], ['f48', 'favicon-48.png'], ['t180', 'apple-touch-icon.png'], ['a192', 'icon-192.png'], ['a512', 'icon-512.png'], ['m512', 'icon-maskable-512.png'], ['e96', 'email-logo.png'], ['og', 'og-image.png']];
runPage(page, async ({ S, ev, sleep, check, reload }) => {
  await S('Emulation.setDeviceMetricsOverride', { width: 1300, height: 1400, deviceScaleFactor: 1, mobile: false });
  await S('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await reload().catch(() => {});
  await sleep(1500);
  await ev('document.fonts.ready.then(() => true)');
  for (const [id, file] of OUT) {
    const r = await ev(`(() => { const b = document.getElementById('${id}').getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; })()`);
    const shot = await S('Page.captureScreenshot', { format: 'png', clip: { ...r, scale: 1 }, captureBeyondViewport: true });
    fs.writeFileSync(path.join(dir, file), Buffer.from(shot.result.data, 'base64'));
    check(`${file} ${r.width}×${r.height}`, r.width > 0);
  }
});
