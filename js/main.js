(function () {
  'use strict';

  var CFG = window.ATAA_CONFIG || {};
  var PAY = CFG.payment || {};
  var html = document.documentElement;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function trim(v) { return (v || '').toString().trim(); }

  /* ---------------- toast ---------------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------------- theme ---------------- */
  var themeToggle = $('#themeToggle');
  var themeMeta = null;
  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = t === 'dark' ? '#0D2429' : '#F8F1BD';
  }
  themeToggle.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('ataa-theme', next); } catch (e) {}
  });
  // follow the device setting until the visitor picks one
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onScheme = function (e) {
    var saved = null;
    try { saved = localStorage.getItem('ataa-theme'); } catch (err) {}
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  };
  if (mq.addEventListener) mq.addEventListener('change', onScheme);

  /* ---------------- mobile menu ---------------- */
  var menuToggle = $('#menuToggle');
  var navLinks = $('#navLinks');
  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('is-open', open);
  }
  menuToggle.addEventListener('click', function () {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  $all('a', navLinks).forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('click', function (e) {
    if (!navLinks.classList.contains('is-open')) return;
    if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 720) setMenu(false);
  });

  /* ---------------- give panel ---------------- */
  var giveToggle = $('#giveToggle');
  var givePanel = $('#givePanel');
  function setGive(open) {
    giveToggle.setAttribute('aria-expanded', String(open));
    givePanel.setAttribute('data-open', String(open));
    $all('.btn', givePanel).forEach(function (b) { b.tabIndex = open ? 0 : -1; });
  }
  giveToggle.addEventListener('click', function () {
    setGive(giveToggle.getAttribute('aria-expanded') !== 'true');
  });

  /* ---------------- contact links from config ---------------- */
  function digits(v) { return trim(v).replace(/[^\d]/g, ''); }
  var contactMap = {
    email: CFG.email && { href: 'mailto:' + trim(CFG.email), text: trim(CFG.email) },
    phone: CFG.phone && { href: 'tel:' + trim(CFG.phone).replace(/\s+/g, ''), text: trim(CFG.phone) },
    whatsapp: CFG.whatsapp && { href: 'https://wa.me/' + digits(CFG.whatsapp) },
    facebook: CFG.facebook && { href: trim(CFG.facebook) },
    instagram: CFG.instagram && { href: trim(CFG.instagram) }
  };
  $all('[data-contact]').forEach(function (el) {
    var info = contactMap[el.getAttribute('data-contact')];
    if (!info) return;
    el.href = info.href;
    var t = $('[data-contact-text]', el);
    if (t && info.text) t.textContent = info.text;
    el.hidden = false;
  });
  var socialRow = $('.social-row');
  if (socialRow && !$all('a', socialRow).some(function (a) { return !a.hidden; })) socialRow.hidden = true;

  /* ---------------- stories viewer ---------------- */
  (function storiesViewer() {
    var viewer = $('#storyViewer');
    var imgs = $all('.story-open img');
    if (!viewer || !imgs.length) return;
    var vImg = $('#viewerImg');
    var vCount = $('#viewerCount');
    var current = 0;
    function show(i) {
      current = (i + imgs.length) % imgs.length;
      vImg.src = imgs[current].currentSrc || imgs[current].src;
      vImg.alt = imgs[current].alt;
      vCount.textContent = (current + 1) + ' / ' + imgs.length;
    }
    $all('.story-open').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lastTrigger = btn;
        show(Number(btn.getAttribute('data-index')) || 0);
        openDialog(viewer);
      });
    });
    // RTL: "next" sits on the left
    $('#viewerNext').addEventListener('click', function () { show(current + 1); });
    $('#viewerPrev').addEventListener('click', function () { show(current - 1); });
    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(current + 1);
      else if (e.key === 'ArrowRight') show(current - 1);
    });
    viewer.addEventListener('click', function (e) {
      if (e.target === viewer || e.target.classList.contains('viewer-stage')) closeDialog(viewer);
    });
    var startX = null;
    viewer.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    viewer.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx > 0 ? current + 1 : current - 1);
      startX = null;
    });
  })();

  /* ---------------- contributors ---------------- */
  (function buildContributors() {
    var list = $('#contributorsList');
    if (!list) return;
    var people = Array.isArray(CFG.contributors) ? CFG.contributors : [];
    var heart = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.5-9.6-9.1C1.2 8.6 3 5.5 6.2 5.2 8 5 9.7 5.9 12 8.3c2.3-2.4 4-3.3 5.8-3.1 3.2.3 5 3.4 3.8 6.7C19.5 16.5 12 21 12 21Z"/></svg>';

    people.forEach(function (p) {
      var name = trim(p && (p.name || p));
      if (!name) return;
      var li = document.createElement('li');
      li.className = 'contributor';
      var av = document.createElement('span');
      av.className = 'avatar';
      av.setAttribute('aria-hidden', 'true');
      // first letter of the name, skipping titles like "م." / "د."
      var letter = name.replace(/^(م|د|أ|المهندس|المهندسة|دكتور|د\.)\.?\s+/, '').charAt(0);
      if (name === 'فاعل خير' || !letter) av.innerHTML = heart;
      else av.textContent = letter;
      var txt = document.createElement('div');
      var b = document.createElement('b'); b.textContent = name;
      txt.appendChild(b);
      if (p.note) {
        var s = document.createElement('small'); s.textContent = trim(p.note);
        txt.appendChild(s);
      }
      li.appendChild(av); li.appendChild(txt);
      list.appendChild(li);
    });

    // always end with an invitation to join
    var li = document.createElement('li');
    var cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'contributor contributor-cta';
    cta.innerHTML = '<span class="avatar" aria-hidden="true">+</span><div><b>مكانك هنا</b><small>ساهم بأداة أو بدعم بسيط</small></div>';
    cta.addEventListener('click', function () {
      document.getElementById('help').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setGive(true);
    });
    li.appendChild(cta);
    list.appendChild(li);
  })();

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- dialogs ---------------- */
  var lastTrigger = null;
  function openDialog(d) {
    if (!d) return;
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
    document.body.classList.add('modal-open');
    var first = $('input:not([type=hidden]):not([tabindex="-1"]), select, textarea', d);
    if (first && window.matchMedia('(pointer:fine)').matches) first.focus();
  }
  function closeDialog(d) {
    if (!d) return;
    if (typeof d.close === 'function') d.close();
    else d.removeAttribute('open');
  }
  $all('dialog.sheet, dialog.viewer').forEach(function (d) {
    d.addEventListener('close', function () {
      document.body.classList.remove('modal-open');
      var form = $('form', d);
      if (form && form.dataset.done === '1') resetForm(form);
      if (lastTrigger) lastTrigger.focus();
    });
    // click on backdrop closes
    d.addEventListener('click', function (e) {
      if (e.target === d) closeDialog(d);
    });
  });
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open-dialog]');
    if (opener) {
      e.preventDefault();
      lastTrigger = opener;
      openDialog(document.getElementById(opener.getAttribute('data-open-dialog')));
      return;
    }
    var closer = e.target.closest('[data-close-dialog]');
    if (closer) closeDialog(closer.closest('dialog'));
  });

  /* ---------------- money dialog ---------------- */
  (function buildPayment() {
    var list = $('#payList');
    var actions = $('#payActions');
    var methods = [
      { key: 'instapay', label: 'إنستاباي (InstaPay)' },
      { key: 'vodafoneCash', label: 'فودافون كاش' },
      { key: 'bankAccount', label: 'تحويل بنكي' }
    ];
    var any = false;
    methods.forEach(function (m) {
      var val = trim(PAY[m.key]);
      if (!val) return;
      any = true;
      var item = document.createElement('div');
      item.className = 'pay-item';
      var info = document.createElement('div');
      var s = document.createElement('strong'); s.textContent = m.label;
      var c = document.createElement('code'); c.textContent = val;
      info.appendChild(s); info.appendChild(c);
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'btn btn-ghost'; btn.textContent = 'نسخ';
      btn.addEventListener('click', function () { copyText(val); });
      item.appendChild(info); item.appendChild(btn);
      list.appendChild(item);
    });
    if (trim(PAY.link)) {
      any = true;
      var a = document.createElement('a');
      a.className = 'btn btn-primary'; a.href = trim(PAY.link); a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'ادفع أونلاين';
      actions.appendChild(a);
    }
    if (contactMap.whatsapp) {
      var w = document.createElement('a');
      w.className = 'btn ' + (actions.children.length ? 'btn-ghost' : 'btn-primary');
      w.href = contactMap.whatsapp.href + '?text=' + encodeURIComponent('السلام عليكم، حابب أساهم ماديًا في مبادرة عطاء.');
      w.target = '_blank'; w.rel = 'noopener';
      w.textContent = any ? 'ابعت الإيصال على واتساب' : 'تواصل معانا على واتساب';
      actions.appendChild(w);
    } else if (contactMap.email) {
      var m = document.createElement('a');
      m.className = 'btn ' + (actions.children.length ? 'btn-ghost' : 'btn-primary');
      m.href = contactMap.email.href + '?subject=' + encodeURIComponent('مساهمة مادية — عطاء');
      m.textContent = 'تواصل معانا بالإيميل';
      actions.appendChild(m);
    }
    if (!any) {
      var p = document.createElement('p');
      p.textContent = 'تواصل معانا وهنبعتلك وسائل التحويل المتاحة.';
      list.appendChild(p);
      $('#payNote').hidden = true;
    }
  })();

  function copyText(val) {
    var done = function () { toast('اتنسخ ✓'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(val).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = val; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast(val); }
      document.body.removeChild(ta);
    }
  }

  /* ---------------- forms ---------------- */
  var ARABIC_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
  function normalizePhone(v) {
    v = trim(v).replace(/[٠-٩]/g, function (d) { return ARABIC_DIGITS[d]; }).replace(/[\s\-()]/g, '');
    if (v.indexOf('+20') === 0) v = '0' + v.slice(3);
    else if (v.indexOf('0020') === 0) v = '0' + v.slice(4);
    else if (/^201\d{9}$/.test(v)) v = '0' + v.slice(2);
    return v;
  }

  function setError(field, msg) {
    if (!field) return;
    field.classList.toggle('invalid', !!msg);
    var e = $('.error', field);
    if (e) e.textContent = msg || '';
  }

  function validate(form) {
    var firstBad = null;
    $all('input[required], select[required], textarea[required]', form).forEach(function (inp) {
      var field = inp.closest('.field');
      var val = trim(inp.value);
      var msg = '';
      if (!val) msg = 'الخانة دي مطلوبة';
      else if (inp.dataset.validate === 'phone') {
        var p = normalizePhone(val);
        if (!/^01[0125]\d{8}$/.test(p)) msg = 'اكتب رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)';
        else inp.value = p;
      } else if (val.length < 2) msg = 'الخانة دي قصيرة أوي';
      setError(field, msg);
      if (msg && !firstBad) firstBad = inp;
    });
    $all('[data-group-required]', form).forEach(function (fs) {
      var ok = $all('input[type=checkbox]', fs).some(function (c) { return c.checked; });
      setError(fs, ok ? '' : 'اختار حاجة واحدة على الأقل');
      if (!ok && !firstBad) firstBad = $('input', fs);
    });
    if (firstBad) {
      firstBad.focus();
      if (firstBad.scrollIntoView) firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return !firstBad;
  }

  function collect(form) {
    var data = { 'النوع': form.dataset.formType };
    $all('input, select, textarea', form).forEach(function (el) {
      if (!el.name || el.name === '_hp') return;
      if (el.type === 'checkbox') {
        if (!el.checked) return;
        data[el.name] = data[el.name] ? data[el.name] + '، ' + el.value : el.value;
      } else if (trim(el.value)) {
        data[el.name] = trim(el.value);
      }
    });
    data['التاريخ'] = new Date().toLocaleString('ar-EG');
    return data;
  }

  function asMessage(data) {
    var lines = ['*' + data['النوع'] + ' — عطاء*'];
    Object.keys(data).forEach(function (k) {
      if (k === 'النوع') return;
      lines.push(k + ': ' + data[k]);
    });
    return lines.join('\n');
  }

  function send(data) {
    var endpoint = trim(CFG.formEndpoint);
    if (endpoint) {
      var body = new URLSearchParams();
      Object.keys(data).forEach(function (k) { body.append(k, data[k]); });
      // no-cors: Google Apps Script doesn't send CORS headers; the request still arrives.
      return fetch(endpoint, { method: 'POST', mode: 'no-cors', body: body })
        .then(function () { return { via: 'server' }; });
    }
    if (contactMap.whatsapp) {
      window.open(contactMap.whatsapp.href + '?text=' + encodeURIComponent(asMessage(data)), '_blank', 'noopener');
      return Promise.resolve({ via: 'whatsapp' });
    }
    if (contactMap.email) {
      window.location.href = contactMap.email.href + '?subject=' + encodeURIComponent(data['النوع'] + ' — عطاء') +
        '&body=' + encodeURIComponent(asMessage(data).replace(/\*/g, ''));
      return Promise.resolve({ via: 'email' });
    }
    return Promise.reject(new Error('no-channel'));
  }

  function showSuccess(form, via) {
    form.dataset.done = '1';
    form.hidden = true;
    var box = document.createElement('div');
    box.className = 'form-success';
    box.setAttribute('role', 'status');
    var note = via === 'server'
      ? 'وصلنا طلبك، وهنتواصل معاك على رقم الموبايل اللي كتبته في أقرب وقت.'
      : via === 'whatsapp'
        ? 'فتحنالك واتساب والرسالة جاهزة. دوس إرسال هناك علشان توصلنا.'
        : 'فتحنالك الإيميل والرسالة جاهزة. دوس إرسال علشان توصلنا.';
    box.innerHTML =
      '<div class="ok-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>' +
      '<h3>شكرًا ليك!</h3><p></p>' +
      '<button type="button" class="btn btn-primary" data-close-dialog>تمام</button>';
    $('p', box).textContent = note;
    form.parentNode.appendChild(box);
  }

  function resetForm(form) {
    form.reset();
    form.hidden = false;
    delete form.dataset.done;
    $all('.field', form).forEach(function (f) { setError(f, ''); });
    var alertEl = $('.form-alert', form);
    if (alertEl) alertEl.remove();
    var box = $('.form-success', form.parentNode);
    if (box) box.remove();
  }

  $all('form.ataa-form').forEach(function (form) {
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f && f.classList.contains('invalid')) setError(f, '');
    });
    form.addEventListener('change', function (e) {
      var fs = e.target.closest('[data-group-required]');
      if (fs) setError(fs, '');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var oldAlert = $('.form-alert', form);
      if (oldAlert) oldAlert.remove();
      if (form.elements._hp && form.elements._hp.value) return; // bot
      if (!validate(form)) return;

      var btn = $('button[type=submit]', form);
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'جاري الإرسال...';

      send(collect(form))
        .then(function (r) { showSuccess(form, r.via); })
        .catch(function (err) {
          var a = document.createElement('div');
          a.className = 'form-alert';
          a.setAttribute('role', 'alert');
          a.textContent = err && err.message === 'no-channel'
            ? 'الإرسال لسه مش متظبط على الموقع. جرب تتواصل معانا من بيانات التواصل تحت.'
            : 'حصلت مشكلة في الإرسال، اتأكد من الإنترنت وجرب تاني.';
          $('.form-actions', form).after(a);
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = label;
        });
    });
  });
})();
