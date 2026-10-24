(function () {
  const get = id => document.getElementById(id);
  let view = null, latestToken = null, latestNumber = null, revision = 0, activeController;

  async function load() {
    const token = new URLSearchParams(location.hash.slice(1)).get('token');
    const changedMember = token !== latestToken;
    latestToken = token;
    const current = ++revision;
    activeController?.abort();
    if(changedMember) {view = null;get('experience').replaceChildren();get('experience').hidden = true;}
    get('live-warning').hidden = true;
    if(!/^[A-Za-z0-9_-]{43}$/.test(token || '')) {
      get('status').hidden = false;
      get('status-copy').textContent = 'Open your private Roll Call card link from the lab.';
      get('retry').hidden = true;
      return;
    }
    if(!view) {get('status').hidden = false;get('status-copy').textContent = 'Finding your card…';get('retry').hidden = true;}
    const controller = new AbortController();
    activeController = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const local = ['127.0.0.1','localhost'].includes(location.hostname);
      const response = await fetch(local ? '/api?action=getRollCallCard' : 'https://bali-dispatch-api.saujanalab-bali.workers.dev/?action=getRollCallCard', {
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),signal:controller.signal,cache:'no-store',referrerPolicy:'no-referrer'
      });
      const snapshot = await response.json();
      if(current !== revision) return;
      if(!response.ok || snapshot.error || !snapshot.member) throw Error('Card unavailable.');
      if(!view) view = window.RollCallExperience.create(get('experience'));
      view.update(snapshot);
      latestNumber = snapshot.member.number;
      get('status').hidden = true;
      get('experience').hidden = false;
    } catch(error) {
      if(current !== revision || error.name === 'AbortError' && controller !== activeController) return;
      if(view) {
        get('live-warning').textContent = 'Could not refresh the card. Staff will check the live reward status at the counter.';
        get('live-warning').hidden = false;
      } else {
        get('status-copy').textContent = error.name === 'AbortError' ? 'Roll Call is taking a moment. Please try again.' : 'We could not open this card. Try again or ask the lab to check your link.';
        get('retry').hidden = false;
      }
    } finally {clearTimeout(timer);if(activeController===controller)activeController=null;}
  }

  get('retry').addEventListener('click', load);
  window.addEventListener('hashchange', load);
  window.addEventListener('online', load);
  document.addEventListener('visibilitychange', () => {if(!document.hidden) load();});
  if(window.BroadcastChannel){const updates=new BroadcastChannel('roll-call-updates');updates.onmessage=event=>{if(event.data?.memberNumber===latestNumber)load();};}
  setInterval(() => {if(!document.hidden&&!activeController) load();}, 10000);
  load();
}());
