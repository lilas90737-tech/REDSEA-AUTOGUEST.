  function goTo(name){
    ['splash','login','dashboard'].forEach(s=>{
      document.getElementById('screen-'+s).style.display = (s===name) ? '' : 'none';
    });
    document.getElementById('screenInner').scrollTop = 0;
    if(name === 'dashboard') logActivity('غرفة ' + GUEST_ROOM + ': اتصل الضيف بالشبكة وعُزل جهازه في VLAN-' + GUEST_ROOM);
    if(name === 'splash') logActivity('غرفة ' + GUEST_ROOM + ': انتهت جلسة الضيف وأُغلقت صلاحيات التحكم بالأجهزة');
  }

  function setTab(name){
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.pane===name));
    document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active', p.id==='pane-'+name));
  }

  function toggleJoin(btn){
    const joined = btn.classList.toggle('joined');
    btn.textContent = joined ? 'مُسجَّل ✓' : 'انضمام';
  }

  let doorLocked = true;
  function toggleLock(){
    doorLocked = !doorLocked;
    const icon = document.getElementById('lockIcon');
    const sub = document.getElementById('lockSub');
    const btn = document.getElementById('lockBtn');
    const status = document.getElementById('lockStatus');
    if(doorLocked){
      icon.textContent = '🔒';
      sub.textContent = 'مقفل · آمن';
      btn.textContent = 'فتح الباب';
      status.textContent = 'تم قفل الباب تلقائياً.';
    } else {
      icon.textContent = '🔓';
      sub.textContent = 'مفتوح الآن';
      btn.textContent = 'قفل الباب';
      status.textContent = 'الباب مفتوح — سيُقفل تلقائياً خلال دقيقة لو لم يُغلق يدوياً.';
    }
    logActivity('غرفة ' + GUEST_ROOM + ': ' + (doorLocked ? 'تم قفل الباب' : 'تم فتح الباب بالمفتاح الرقمي'));
  }

  function onCurtainToggle(){
    const on = document.getElementById('curtainToggle').checked;
    const pct = document.getElementById('curtainSlider').value;
    document.getElementById('curtainSub').textContent = on ? ('مفتوحة · ' + pct + '%') : 'مغلقة بالكامل';
    if(!on){
      document.getElementById('curtainSlider').value = 0;
      document.getElementById('curtainPct').textContent = '0%';
    }
  }
  function onCurtain(v){
    document.getElementById('curtainPct').textContent = v + '%';
    const on = document.getElementById('curtainToggle').checked;
    document.getElementById('curtainSub').textContent = (v==0) ? 'مغلقة بالكامل' : (on ? ('مفتوحة · ' + v + '%') : 'مغلقة بالكامل');
    if(v>0 && !on){
      document.getElementById('curtainToggle').checked = true;
    }
  }

  function onLight(){
    const on = document.getElementById('lightToggle').checked;
    document.getElementById('lightSub').textContent = on ? 'مضاءة · دافئة' : 'مطفأة';
  }
  function onDim(v){
    document.getElementById('lightPct').textContent = v + '%';
  }
  function onAc(v){
    document.getElementById('acVal').textContent = v + '°';
    document.getElementById('acSub').textContent = v + '° مئوية';
  }

  let coffeeRunning = false;
  function startCoffee(){
    if(coffeeRunning) return;
    coffeeRunning = true;
    const btn = document.getElementById('coffeeBtn');
    const wrap = document.getElementById('coffeeProgress');
    const bar = document.getElementById('coffeeBar');
    const status = document.getElementById('coffeeStatus');
    logActivity('غرفة ' + GUEST_ROOM + ': تشغيل آلة القهوة');
    btn.disabled = true;
    btn.textContent = 'جارٍ التحضير…';
    wrap.style.display = 'block';
    status.style.display = 'block';
    status.textContent = 'جارٍ تحضير القهوة…';
    requestAnimationFrame(()=>{ bar.style.width = '100%'; });
    setTimeout(()=>{
      status.textContent = '☕ القهوة جاهزة — بالهناء!';
      btn.textContent = 'تشغيل مرة أخرى';
      btn.disabled = false;
      coffeeRunning = false;
    }, 3000);
  }

  function scheduleCoffee(){
    const t = document.getElementById('coffeeTime').value || '07:00';
    const confirm = document.getElementById('coffeeScheduleConfirm');
    confirm.style.display = 'block';
    confirm.textContent = 'تم جدولة القهوة يومياً الساعة ' + t + ' — ستُحضَّر تلقائياً قبل استيقاظك.';
  }

  function pickCleanCustom(){
    document.querySelectorAll('.clean-opt').forEach(b=>b.classList.remove('selected'));
    const t = document.getElementById('cleanTime').value || '14:00';
    guestRequestClean('الساعة ' + t, 'تم جدولة التنظيف الساعة ' + t + ' وإرساله لفريق التدبير المنزلي.');
  }

  function pickClean(btn, label){
    document.querySelectorAll('.clean-opt').forEach(b=>b.classList.remove('selected'));
    if(guestRequestClean(label)) btn.classList.add('selected');
  }

  function toggleTheme(){
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    if(current === 'dark'){
      root.setAttribute('data-theme','light');
      document.getElementById('themeBtn').textContent = '🌙 وضع ليلي';
    } else {
      root.setAttribute('data-theme','dark');
      document.getElementById('themeBtn').textContent = '☀️ وضع نهاري';
    }
  }

  function updateClock(){
    try{
      const now = new Date();
      const h = now.getHours()%12 || 12;
      const m = String(now.getMinutes()).padStart(2,'0');
      document.getElementById('clock').textContent = h + ':' + m;
    }catch(e){}
  }
  updateClock();
  setInterval(updateClock, 30000);

  /* ================= لوحة إدارة الفندق ================= */
  let GUEST_ROOM = '214';
  const STATUS_LABEL = {
    clean: 'نظيفة',
    waiting: 'بانتظار الدور',
    cleaning: 'قيد التنظيف',
    dnd: 'عدم إزعاج',
    vacant: 'شاغرة'
  };

  // بيانات تجريبية تمثل نظام PMS
  const rooms = [
    {no:'201', status:'clean',    label:'',          src:''},
    {no:'202', status:'clean',    label:'',          src:''},
    {no:'203', status:'waiting',  label:'بعد الظهر', src:'من تطبيق الضيف'},
    {no:'204', status:'clean',    label:'',          src:''},
    {no:'205', status:'vacant',   label:'',          src:''},
    {no:'206', status:'cleaning', label:'الآن',      src:'من تطبيق الضيف'},
    {no:'207', status:'clean',    label:'',          src:''},
    {no:'208', status:'dnd',      label:'',          src:''},
    {no:'210', status:'clean',    label:'',          src:''},
    {no:'212', status:'vacant',   label:'',          src:''},
    {no:'214', status:'clean',    label:'',          src:''},
    {no:'216', status:'clean',    label:'',          src:''}
  ];
  const activity = [
    {t: nowHM(), text: 'غرفة 206: بدأ فريق التدبير المنزلي التنظيف'},
    {t: nowHM(), text: 'PMS: اكتملت مزامنة حالة الغرف'}
  ];

  function getRoom(no){ return rooms.find(r => r.no === no); }

  function nowHM(){
    const d = new Date();
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }

  function el(tag, cls, text){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text !== undefined) e.textContent = text;
    return e;
  }

  function logActivity(text){
    activity.unshift({t: nowHM(), text: text});
    if(activity.length > 8) activity.pop();
    renderAdmin();
  }

  function setRoom(no, status, label, src){
    const r = getRoom(no);
    r.status = status;
    r.label = label || '';
    r.src = src || '';
  }

  function renderAdmin(){
    const grid = document.getElementById('roomGrid');
    if(!grid) return;
    grid.replaceChildren();
    const counts = {clean:0, waiting:0, cleaning:0, dnd:0, vacant:0};

    rooms.forEach(r => {
      counts[r.status]++;
      const card = el('div', 'room' + (r.no === GUEST_ROOM ? ' mine' : ''));
      card.dataset.s = r.status;
      card.appendChild(el('div', 'room-no', r.no));
      const st = el('div', 'room-st');
      st.appendChild(el('i'));
      st.appendChild(el('span', '', STATUS_LABEL[r.status]));
      card.appendChild(st);
      card.appendChild(el('div', 'room-note', r.label || (r.no === GUEST_ROOM ? 'غرفة الضيف' : '')));
      grid.appendChild(card);
    });

    document.getElementById('stClean').textContent = counts.clean;
    document.getElementById('stWaiting').textContent = counts.waiting;
    document.getElementById('stCleaning').textContent = counts.cleaning;
    document.getElementById('stDnd').textContent = counts.dnd;

    // طابور طلبات النظافة: الجاري أولاً ثم العاجل ثم المجدول
    const list = document.getElementById('queueList');
    list.replaceChildren();
    const rank = r => r.status === 'cleaning' ? 0 : (r.label === 'الآن' ? 1 : 2);
    const pending = rooms
      .filter(r => r.status === 'waiting' || r.status === 'cleaning')
      .sort((a, b) => rank(a) - rank(b));

    if(!pending.length){
      list.appendChild(el('div', 'q-empty', 'لا توجد طلبات نظافة حالياً'));
    }
    pending.forEach(r => {
      const inProgress = r.status === 'cleaning';
      const row = el('div', 'q-item');
      row.appendChild(el('div', 'q-room', r.no));
      const meta = el('div', 'q-meta');
      meta.appendChild(el('b', '', inProgress ? 'قيد التنظيف الآن' : 'بانتظار الدور'));
      meta.appendChild(el('span', '', r.src + ' · ' + r.label));
      row.appendChild(meta);
      const btn = el('button', 'mini-btn' + (inProgress ? ' done' : ''), inProgress ? 'تم الانتهاء' : 'بدء التنظيف');
      btn.type = 'button';
      btn.addEventListener('click', () => inProgress ? staffFinish(r.no) : staffStart(r.no));
      row.appendChild(btn);
      list.appendChild(row);
    });

    const ul = document.getElementById('activityList');
    ul.replaceChildren();
    activity.forEach(a => {
      const li = el('li');
      li.appendChild(el('time', '', a.t));
      li.appendChild(el('span', '', a.text));
      ul.appendChild(li);
    });
  }

  function notifyGuest(msg){
    const c = document.getElementById('cleanConfirm');
    c.style.display = 'block';
    c.textContent = msg;
  }

  // طلب من شاشة الضيف: يرجع true لو تم تسجيل الطلب
  function guestRequestClean(label, msg){
    const r = getRoom(GUEST_ROOM);
    if(r.status === 'cleaning'){
      notifyGuest('فريق التدبير المنزلي يعمل في غرفتك حالياً.');
      return false;
    }
    if(label === 'عدم الإزعاج'){
      setRoom(GUEST_ROOM, 'dnd', '', '');
      logActivity('غرفة ' + GUEST_ROOM + ': تفعيل عدم الإزعاج');
      notifyGuest('تم إعلام فريق النظافة بعدم الإزعاج حتى إشعار آخر.');
    } else {
      setRoom(GUEST_ROOM, 'waiting', label, 'من تطبيق الضيف');
      logActivity('غرفة ' + GUEST_ROOM + ': طلب تنظيف (' + label + ')');
      notifyGuest(msg || ('تم إرسال طلبك لفريق التدبير المنزلي: ' + label + '.'));
    }
    return true;
  }

  // إجراءات موظف التدبير المنزلي من لوحة الإدارة
  function staffStart(no){
    const r = getRoom(no);
    setRoom(no, 'cleaning', r.label, r.src);
    logActivity('غرفة ' + no + ': بدأ فريق التدبير المنزلي التنظيف');
    if(no === GUEST_ROOM) notifyGuest('بدأ فريق التدبير المنزلي تنظيف غرفتك الآن.');
  }

  function staffFinish(no){
    setRoom(no, 'clean', '', '');
    logActivity('غرفة ' + no + ': تم الانتهاء من التنظيف والغرفة جاهزة');
    if(no === GUEST_ROOM){
      document.querySelectorAll('.clean-opt').forEach(b => b.classList.remove('selected'));
      notifyGuest('تم الانتهاء من تنظيف غرفتك ✓');
    }
  }

  // محاكاة تكامل PMS: تسجيل مغادرة يضيف طلب تنظيف تلقائياً
  function simulateCheckout(){
    const r = rooms.find(x => x.status === 'clean' && x.no !== GUEST_ROOM);
    if(!r){
      logActivity('PMS: لا توجد غرف متاحة لمحاكاة المغادرة');
      return;
    }
    setRoom(r.no, 'waiting', 'بعد المغادرة', 'من PMS');
    logActivity('PMS: تسجيل مغادرة غرفة ' + r.no + ' وإضافة طلب تنظيف تلقائياً');
  }

  function setSideTab(name){
    ['explain', 'admin'].forEach(n => {
      document.getElementById('side-' + n).classList.toggle('active', n === name);
      const t = document.getElementById('tab-' + n);
      t.classList.toggle('active', n === name);
      t.setAttribute('aria-selected', n === name ? 'true' : 'false');
    });
  }

  renderAdmin();


  /* ============ تسجيل دخول الضيف ============ */
  function login(){
    const room = document.getElementById('roomNo').value.trim();
    const name = document.getElementById('lastName').value.trim();
    const err = document.getElementById('loginError');
    if(!room || !name){
      err.textContent = 'أدخل رقم الغرفة واسم العائلة للمتابعة.';
      err.style.display = 'block';
      return;
    }
    err.style.display = 'none';

    // غرفة جديدة غير موجودة في النظام: تُضاف كغرفة نظيفة
    if(!getRoom(room)){
      rooms.push({no: room, status: 'clean', label: '', src: ''});
      rooms.sort((a, b) => parseInt(a.no, 10) - parseInt(b.no, 10) || a.no.localeCompare(b.no));
    }

    // تصفير حالة طلب النظافة في واجهة الضيف عند تغيير الغرفة
    if(room !== GUEST_ROOM){
      document.querySelectorAll('.clean-opt').forEach(b => b.classList.remove('selected'));
      const c = document.getElementById('cleanConfirm');
      c.style.display = 'none';
      c.textContent = '';
    }

    GUEST_ROOM = room;
    document.getElementById('guestRoomLabel').textContent = room;
    document.getElementById('guestNameLabel').textContent = name;
    document.getElementById('adminRoomHint').textContent = room;
    goTo('dashboard');
  }
