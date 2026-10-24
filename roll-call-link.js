(function () {
  const get=id=>document.getElementById(id);
  let revision=0,activeController;
  async function load() {
    const current=++revision;
    activeController?.abort();
    const link=get('roll-call-link'),wrap=get('roll-call-wrap');
    link.hidden=true;wrap.hidden=true;link.href='#';
    const token=new URLSearchParams(location.hash.slice(1)).get('rollCall');
    if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))return;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    activeController=controller;
    try {
      const local=['localhost','127.0.0.1'].includes(location.hostname);
      const response=await fetch(local?'/api?action=getRollCallCard':'https://bali-dispatch-api.saujanalab-bali.workers.dev/?action=getRollCallCard',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),signal:controller.signal,cache:'no-store',referrerPolicy:'no-referrer'
      });
      const data=await response.json();
      if(current!==revision||!response.ok||!data.member)return;
      const stamps=Number(data.currentCard?.stamps)||0,card=Number(data.currentCard?.number)||1;
      const ready=Number(data.availableRewards)||0;
      get('roll-call-art-number').textContent=String(card).padStart(3,'0');
      get('roll-call-member-name').textContent=data.member.name;
      get('roll-call-member-number').textContent=data.member.number;
      get('roll-call-member-progress').textContent=`Card ${String(card).padStart(3,'0')} / ${stamps} of 10 stamps`;
      get('roll-call-member-reward').textContent=ready?`${ready} ${ready===1?'reward':'rewards'} ready`:`${(stamps<5?5:10)-stamps} more rolls to your next reward`;
      get('roll-call-member-reward').hidden=false;
      wrap.classList.toggle('has-reward',ready>0);
      link.setAttribute('aria-label',`Open Roll Call member card for ${data.member.name}`);
      link.href=`roll-call/#token=${encodeURIComponent(token)}`;
      link.hidden=false;wrap.hidden=false;
    }catch{}finally{clearTimeout(timer);if(activeController===controller)activeController=null;}
  }
  window.addEventListener('hashchange',load);load();
}());
