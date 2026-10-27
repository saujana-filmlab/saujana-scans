(function () {
  const assetBase = new URL('assets/', document.currentScript.src).href;
  const pad = number => String(number).padStart(3, '0');
  const displayCard = snapshot => snapshot.currentCard.stamps === 0 && snapshot.currentCard.number > 1
    ? snapshot.cards.find(card => card.number === snapshot.currentCard.number - 1 && card.stamps === 10)?.number || snapshot.currentCard.number
    : snapshot.currentCard.number;
  const date = value => value ? new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Makassar'}).format(new Date(value)) : '';
  const cardDate = value => {
    if(!value) return null;
    const parts = new Intl.DateTimeFormat('en-GB', {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Makassar'}).formatToParts(new Date(value));
    const part = type => parts.find(item => item.type === type)?.value || '';
    return {day:part('day'),month:part('month'),year:part('year').slice(-2)};
  };
  const node = (tag, className, content) => {
    const element = document.createElement(tag);
    if(className) element.className = className;
    if(content !== undefined) element.textContent = content;
    return element;
  };

  function stableInk(member, card, slot) {
    const key = `${member}:${card}:${slot}`;
    let hash = 2166136261;
    for(const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    const channel = shift => (hash >>> shift) & 15;
    return {
      x: `${(channel(0)-7.5)*.62}%`,
      y: `${(channel(4)-7.5)*.5}%`,
      tilt: `${(channel(8)-7.5)*1.16}deg`,
      pressure: String(.93 + channel(12)*.005),
      opacity: String(.74 + channel(16)*.011),
      grain: `${channel(20)*2}px ${channel(24)*2}px`
    };
  }

  function story(snapshot) {
    if(snapshot.availableRewards) {
      if(snapshot.totalStamps === 5) return 'Five rolls down. Your next C-41 is on us.';
      return `${snapshot.totalStamps} rolls stamped. A C-41 reward is ready for you.`;
    }
    const current = snapshot.currentCard.stamps;
    if(!snapshot.totalStamps) return 'Your first roll starts here.';
    if(!current) return 'New card, same good habit. Keep rolling.';
    const until = (current < 5 ? 5 : 10) - current;
    return `${current} on this card. ${until} more ${until === 1 ? 'roll' : 'rolls'} to the next reward.`;
  }

  function ticket(reward) {
    const article = node('article', `rc-ticket is-${reward.status}`);
    const copy = node('div', 'rc-ticket-copy');
    copy.append(node('p','rc-ticket-source',`CARD ${pad(reward.cardNumber)} / STAMP ${String(reward.atStamp).padStart(2,'0')}`));
    copy.append(node('h3','', 'FREE C-41 DEVELOP + SCAN'));
    const detail = node('p','rc-ticket-detail','One roll, on us.');
    copy.append(detail);
    if(reward.status === 'ready' && reward.expiresAt) copy.append(node('p','rc-ticket-date',`Valid until ${date(reward.expiresAt)}`));
    else if(reward.status === 'expired' && reward.expiresAt) copy.append(node('p','rc-ticket-date',`Expired ${date(reward.expiresAt)}`));
    else if(reward.status === 'used' && reward.usedAt) copy.append(node('p','rc-ticket-date',`Used ${date(reward.usedAt)}`));
    else if(reward.status === 'verify') copy.append(node('p','rc-ticket-date','Ask staff to check the paper stamp date.'));
    const status = node('span','rc-ticket-status',reward.status === 'ready' ? 'READY' : reward.status === 'verify' ? 'CHECK DATE' : reward.status.toUpperCase());
    article.append(copy,status);
    return article;
  }

  function create(root) {
    root.innerHTML = `
      <div class="rc-intro"><h1 class="rc-print-title"><span class="rc-visually-hidden">Roll Call</span><span class="rc-title-crop" aria-hidden="true"><img src="${assetBase}roll-call-back.png" alt=""></span></h1><p class="rc-title-sub">LOYALTY CARD</p><p class="rc-member-line"><strong id="rc-page-name"></strong><span id="rc-page-number"></span></p><p class="rc-story" id="rc-story"></p></div>
      <div class="rc-card-nav"><span id="rc-card-counter"></span><label>VIEW CARD <select id="rc-card-select" aria-label="Choose Roll Call card"></select></label></div>
      <div class="rc-card-stage">
        <button type="button" class="rc-card-button" id="rc-flip" aria-label="Flip Roll Call card to its stamp side" aria-pressed="false" title="Flip card">
          <span class="rc-card-rotator">
            <span class="rc-card-face rc-front">
              <img class="rc-card-art" src="${assetBase}roll-call-front.png" alt="" aria-hidden="true">
              <span class="rc-cover-card" id="rc-cover-card"></span>
              <span class="rc-cover-date" id="rc-cover-date"><span id="rc-cover-day"></span><span id="rc-cover-month"></span><span id="rc-cover-year"></span></span>
              <span class="rc-cover-issued-number" id="rc-cover-issued-number"></span>
              <span class="rc-cover-member"><strong id="rc-cover-name"></strong><span id="rc-cover-number"></span></span>
            </span>
            <span class="rc-card-face rc-back">
              <img class="rc-card-art" src="${assetBase}roll-call-back.png" alt="" aria-hidden="true">
              <span class="rc-stamp-grid" id="rc-stamps" aria-hidden="true"></span>
            </span>
          </span>
        </button>
      </div>
      <div class="rc-card-foot"><p id="rc-progress-text"></p><button type="button" id="rc-turn-control" title="Flip card">SHOW STAMPS</button></div>
      <div class="rc-below">
        <section class="rc-rewards" aria-labelledby="rc-rewards-title"><div class="rc-section-heading"><p class="rc-kicker">THE GOOD STUFF</p><h2 id="rc-rewards-title">Your rewards</h2></div><div id="rc-ready-list" class="rc-ticket-list"></div><p class="rc-counter-note">Show this to our staff to redeem your voucher.</p><details id="rc-history" class="rc-disclosure"><summary id="rc-history-label"></summary><div id="rc-history-list" class="rc-ticket-list"></div></details></section>
        <details class="rc-disclosure rc-rules"><summary>HOW ROLL CALL WORKS</summary><div><p>Every paid roll we develop and scan earns a stamp. C-41, B&amp;W, ECN-2, we don’t play favourites.</p><p>Land on stamp 5 or 10 and a free C-41 develop + scan is yours. Each reward is good for 30 days from the day that stamp lands. The free roll won’t earn another stamp, though.</p><p>Our lab team adds stamps and marks rewards as used. When your card is full, it stays here as a little badge of honour.</p></div></details>
      </div>`;
    const get = id => root.querySelector(`#${id}`);
    const flip = get('rc-flip');
    const picker = get('rc-card-select');
    let snapshot = null, chosenCard = 1, previousTotal = null;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const hover = matchMedia('(hover: hover) and (pointer: fine)');

    function turn(stamps) {
      flip.classList.toggle('is-back', stamps);
      flip.setAttribute('aria-pressed', String(stamps));
      const card = snapshot?.cards.find(item => item.number === chosenCard);
      flip.setAttribute('aria-label', card ? `${stamps ? 'Stamp side' : 'Cover'} of Roll Call card ${pad(chosenCard)} for ${snapshot.member.name}, ${card.stamps} of 10 stamps. Flip to ${stamps ? 'cover' : 'stamps'}.` : 'Flip Roll Call card');
      flip.title = stamps ? 'Show cover' : 'Show stamps';
      get('rc-turn-control').textContent = stamps ? 'SHOW COVER' : 'SHOW STAMPS';
    }
    flip.addEventListener('click', () => turn(!flip.classList.contains('is-back')));
    get('rc-turn-control').addEventListener('click', () => turn(!flip.classList.contains('is-back')));
    flip.addEventListener('pointermove', event => {
      if(!hover.matches || still.matches || event.pointerType !== 'mouse') return;
      const box = flip.getBoundingClientRect();
      flip.style.setProperty('--tilt-x', `${((event.clientY-box.top)/box.height-.5)*-3}deg`);
      flip.style.setProperty('--tilt-y', `${((event.clientX-box.left)/box.width-.5)*3}deg`);
    });
    flip.addEventListener('pointerleave', () => {flip.style.removeProperty('--tilt-x');flip.style.removeProperty('--tilt-y');});

    function renderCard() {
      const card = snapshot.cards.find(item => item.number === chosenCard) || snapshot.currentCard;
      chosenCard = card.number;
      picker.value = String(chosenCard);
      get('rc-card-counter').textContent = `CARD ${pad(chosenCard)} / ${pad(snapshot.currentCard.number)}`;
      get('rc-page-name').textContent = snapshot.member.name;
      get('rc-page-number').textContent = `${snapshot.member.number} / CARD ${pad(chosenCard)}`;
      get('rc-cover-card').textContent = pad(chosenCard);
      const issued = cardDate(card.issuedAt);
      get('rc-cover-day').textContent = issued?.day || '';
      get('rc-cover-month').textContent = issued?.month || '';
      get('rc-cover-year').textContent = issued?.year || '';
      get('rc-cover-date').hidden = !card.issuedAt;
      get('rc-cover-name').textContent = snapshot.member.name;
      get('rc-cover-name').className = snapshot.member.name.length > 32 ? 'is-very-long' : snapshot.member.name.length > 22 ? 'is-long' : '';
      get('rc-cover-number').textContent = snapshot.member.number;
      get('rc-cover-issued-number').textContent = snapshot.member.number;
      get('rc-progress-text').textContent = `${card.stamps} / 10 STAMPS  ·  ${snapshot.completedCards} ${snapshot.completedCards === 1 ? 'CARD' : 'CARDS'} COMPLETED`;

      const stamps = document.createDocumentFragment();
      for(let index = 1; index <= 10; index++) {
        const slot = node('span','rc-stamp-slot');
        if(index <= card.stamps) {
          const variant = stableInk(snapshot.member.number, chosenCard, index);
          const ink = node('span',`rc-ink${index === 5 || index === 10 ? ' is-milestone' : ''}`);
          ink.style.setProperty('--ink-x',variant.x);
          ink.style.setProperty('--ink-y',variant.y);
          ink.style.setProperty('--ink-rotation',variant.tilt);
          ink.style.setProperty('--ink-pressure',variant.pressure);
          ink.style.setProperty('--ink-opacity',variant.opacity);
          ink.style.setProperty('--grain-position',variant.grain);
          const globalIndex = (chosenCard-1)*10 + index;
          if(previousTotal !== null && globalIndex > previousTotal && globalIndex <= snapshot.totalStamps && !still.matches) ink.classList.add('is-new');
          const image = node('img');image.src = `${assetBase}stamp.png`;image.alt = '';
          ink.append(image);slot.append(ink);
          const reward = snapshot.rewards.find(item => item.cardNumber === chosenCard && item.atStamp === index);
          if(reward && ['used','expired'].includes(reward.status)) slot.append(node('span',`rc-ink-status is-${reward.status}`,reward.status.toUpperCase()));
        }
        stamps.append(slot);
      }
      get('rc-stamps').replaceChildren(stamps);
      turn(flip.classList.contains('is-back'));
    }

    picker.addEventListener('change', () => {chosenCard=Number(picker.value);previousTotal=null;turn(true);renderCard();previousTotal=snapshot.totalStamps;});

    function update(next, options = {}) {
      const old = snapshot;
      const oldTotal = old?.totalStamps;
      snapshot = next;
      if(!old || options.resetCard || chosenCard > next.currentCard.number || next.totalStamps !== old.totalStamps) chosenCard = displayCard(next);
      if(old && next.totalStamps > old.totalStamps) turn(true);
      previousTotal = oldTotal ?? null;
      get('rc-story').textContent = story(next);
      picker.replaceChildren(...next.cards.map(card => {const option=node('option','',`Card ${pad(card.number)}`);option.value=card.number;return option;}));
      renderCard();
      previousTotal = next.totalStamps;
      const ready = next.rewards.filter(reward => reward.status === 'ready');
      const history = next.rewards.filter(reward => reward.status !== 'ready');
      get('rc-ready-list').replaceChildren(...ready.map(ticket));
      if(!ready.length) get('rc-ready-list').append(node('p','rc-no-reward','Your next C-41 reward is waiting at stamp 5 or 10.'));
      get('rc-history-list').replaceChildren(...history.map(ticket));
      get('rc-history').hidden = history.length === 0;
      get('rc-history-label').textContent = `PAST REWARDS (${history.length})`;
    }
    return {update,turn};
  }
  window.RollCallExperience = {create};
}());
