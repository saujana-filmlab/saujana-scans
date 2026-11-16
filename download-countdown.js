(() => {
  const reminder = document.getElementById('download-countdown');
  const fallback = document.getElementById('download-reminder-fallback');
  const params = new URLSearchParams(location.search);
  const date = params.get('date');
  if (!params.get('link') && !params.get('order')) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return;
  const day = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(+day) || day.toISOString().slice(0, 10) !== date) return;

  const dayMs = 86400000;
  const baliOffset = 8 * 3600000;
  const start = +day - baliOffset;
  // A date-only link has no send time. Count the delivery date as the first Bali calendar day.
  const cutoff = start + 7 * dayMs;
  const displayDate = new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Makassar', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'});
  const title = document.getElementById('download-countdown-title');
  const copy = document.getElementById('download-countdown-copy');
  const deadline = document.getElementById('download-countdown-date');
  const action = document.getElementById('download-countdown-action');
  const mascot = reminder.querySelector('.download-countdown-mascot img');
  const frames = [...reminder.querySelectorAll('.download-countdown-frames span')];
  const art = {
    active: 'download-countdown-walk.webp',
    soon: 'download-countdown-neggie.webp',
    last: 'download-countdown-rollo.webp',
    past: 'download-countdown-sitting.webp'
  };
  const message = {
    active: 'A little nudge from Rollo: save a copy somewhere safe.',
    soon: 'Still on your list? Now is a good time to save a copy.',
    last: 'One last nudge from Rollo. Save your scans today.',
    past: 'If you can no longer open your scans, message us and we\'ll see what we can do.'
  };
  function update() {
    const now = Date.now();
    if (now < start) return;
    const days = Math.max(0, Math.min(7, Math.ceil((cutoff - now) / dayMs)));
    const state = days === 0 ? 'past' : days === 1 ? 'last' : days <= 2 ? 'soon' : 'active';
    if (!reminder.hidden && reminder.dataset.days === String(days)) return;
    reminder.dataset.state = state;
    reminder.dataset.days = days;
    if (mascot.getAttribute('src') !== art[state]) mascot.src = art[state];
    title.textContent = state === 'past' ? 'The estimated download window has passed'
      : state === 'last' ? 'Last day to save your scans'
      : days === 7 ? 'Fresh from the lab'
      : days + ' days left to save your scans';
    copy.textContent = days === 7 ? 'You have 7 days to download your scans. Save a copy somewhere safe.' : message[state];
    deadline.hidden = state === 'past';
    deadline.dateTime = new Date(cutoff - 60000).toISOString();
    deadline.textContent = 'Estimated deadline: ' + displayDate.format(cutoff - 60000) + ', 23:59 WITA';
    frames.forEach((frame, i) => frame.classList.toggle('remaining', i < days));
    action.hidden = state !== 'past';
    fallback.hidden = true;
    reminder.hidden = false;
  }
  update();
  setInterval(update, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})();
