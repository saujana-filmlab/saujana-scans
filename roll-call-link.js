(function () {
  const get=id=>document.getElementById(id);
  let revision=0,activeController;
  async function load() {
    const current=++revision;
    activeController?.abort();
    const link=get('roll-call-link'),wrap=get('roll-call-wrap');
    link.hidden=true;wrap.hidden=true;link.href='#';
    const failure=get('roll-call-load-error');
    if(failure)failure.hidden=true;
    const token=new URLSearchParams(location.hash.slice(1)).get('rollCall');
    if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))return;
    for(let attempt=0;attempt<3;attempt++){
      if(current!==revision)return;
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
      activeController=controller;
      try {
      const local=['localhost','127.0.0.1'].includes(location.hostname);
      const response=await fetch(local?'/api?action=getRollCallCard':'https://bali-dispatch-api.saujanalab-bali.workers.dev/?action=getRollCallCard',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),signal:controller.signal,cache:'no-store',referrerPolicy:'no-referrer'
      });
      const data=await response.json();
      if(current!==revision)return;
      if(data.accessDisabled)return;
      if(data.error==='Card not found.')return;
      if(!response.ok||!data.member)throw Error('Card lookup failed');
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
      return;
      }catch{
        if(current!==revision)return;
        if(attempt===2&&failure){
          failure.hidden=false;wrap.hidden=false;
          get('roll-call-fallback-link').href=`roll-call/#token=${encodeURIComponent(token)}`;
        }
      }finally{clearTimeout(timer);if(activeController===controller)activeController=null;}
      if(attempt<2)await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
    }
  }
  get('roll-call-retry')?.addEventListener('click',load);
  window.addEventListener('hashchange',load);load();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
  setInterval(()=>{if(!document.hidden&&!activeController)load();},30000);
}());
