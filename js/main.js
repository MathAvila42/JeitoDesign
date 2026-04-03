// ── SUPABASE ──────────────────────────────────────────────────────────────────
// Tabelas necessárias no Supabase (SQL):
//   create table posts (id uuid primary key default gen_random_uuid(), title text, tag text default 'Blog', body text, img text, date text, created_at timestamptz default now());
//   create table projetos (id uuid primary key default gen_random_uuid(), titulo text, tipo text, descricao text, imagem text, created_at timestamptz default now());
//   Storage: bucket "media" (público) com pastas posts/ e projetos/
var sb;
try {
  sb = window.supabase.createClient(
    'https://kbwspfpvrisxowzpnuip.supabase.co',
    'sb_publishable_XXbBXU_mYm7Ltvp082Ddrw_I7SlWl1h'
  );
} catch(e) { console.warn('Supabase:', e); }

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const PAGES = ['home','quemsomos','servico','projetos','conteudos','contato','admin'];
const PAGE_MAP = {
  '/':'home', '/home':'home', '/quemsomos':'quemsomos', '/servico':'servico',
  '/projetos':'projetos', '/conteudos':'conteudos', '/contato':'contato',
  '/admin':'admin'
};
let currentPage = 'home';

// ── STORAGE ───────────────────────────────────────────────────────────────────
const store = {
  get: function(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } },
  set: function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
};

// ── NAV ───────────────────────────────────────────────────────────────────────
function nav(page){
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  var el = document.getElementById('pg-'+page);
  if(el) el.classList.add('active');
  currentPage = page;
  window.scrollTo(0,0);
  try{ history.pushState({page:page},'','/'+page==='home'?'/':('/'+page)); }catch(e){}
  initReveal();
  if(page==='blog'||page==='conteudos') showBlogList();
}

window.addEventListener('popstate', function(e){
  var p = (e.state&&e.state.page)||PAGE_MAP[location.pathname]||'home';
  var el = document.getElementById('pg-'+p);
  if(el){
    document.querySelectorAll('.page').forEach(function(pg){ pg.classList.remove('active'); });
    el.classList.add('active');
    currentPage=p; initReveal();
  }
});

// Init routing on load
(function(){
  var path = location.pathname;
  var p = PAGE_MAP[path] || 'home';
  // Admin only accessible via /admin URL
  if(p === 'admin'){
    var allPages = document.querySelectorAll('.page');
    allPages.forEach(function(pg){ pg.classList.remove('active'); });
    var adminEl = document.getElementById('pg-admin');
    if(adminEl) adminEl.classList.add('active');
    currentPage = 'admin';
  } else if(p !== 'home'){
    nav(p);
  }
})();

// ── NAV SCROLL ────────────────────────────────────────────────────────────────
window.addEventListener('scroll', function(){
  var n = document.getElementById('nav');
  if(n) n.classList.toggle('scrolled', window.scrollY > 40);
});

// ── MOBILE MENU ───────────────────────────────────────────────────────────────
function toggleMob(){ document.getElementById('mob').classList.toggle('open'); }
function closeMob(){ document.getElementById('mob').classList.remove('open'); }

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
function initReveal(){
  setTimeout(function(){
    var els = document.querySelectorAll('#pg-'+currentPage+' .rv');
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('in'); });
    },{threshold:0.08});
    els.forEach(function(el){
      el.classList.remove('in');
      obs.observe(el);
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight) el.classList.add('in');
    });
  },50);
}
initReveal();

// ── FAQ ───────────────────────────────────────────────────────────────────────
function toggleFaq(el){
  var item = el.parentElement;
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(i){ i.classList.remove('open'); });
  if(!wasOpen) item.classList.add('open');
}

// ── BLOG (Firestore) ─────────────────────────────────────────────────────────
var blogPosts = [];
var adminLoggedIn = false;

function loadPosts(callback) {
  if (!sb) { if(callback) callback(); return; }
  sb.from('posts').select('*').order('created_at', { ascending: false })
    .then(function(res) {
      if(res.error){ console.warn('loadPosts:', res.error); if(callback) callback(); return; }
      blogPosts = (res.data||[]).map(function(d){
        return { id:d.id, title:d.title||'', tag:d.tag||'Blog', body:d.body||'', img:d.img||'', date:d.date||'' };
      });
      renderBlogGrid();
      renderAdminList();
      if(callback) callback();
    });
}

function adminLogin(){
  var pw = document.getElementById('admin-pw').value;
  if(pw === 'jeito2024'){
    adminLoggedIn = true;
    document.getElementById('admin-login-wrap').style.display = 'none';
    document.getElementById('admin-panel-wrap').style.display = 'block';
    loadPosts();
    loadProjects();
  } else {
    document.getElementById('admin-err').style.display = 'block';
  }
}

function showNewPostForm(){
  document.getElementById('post-title').value='';
  document.getElementById('post-tag').value='';
  document.getElementById('post-body').value='';
  document.getElementById('post-img').value='';
  document.getElementById('img-preview').style.display='none';
  document.getElementById('edit-id').value='';
  document.getElementById('form-section-title').textContent='Novo post';
  document.getElementById('publish-btn').textContent='Publicar post';
  document.getElementById('admin-form-section').style.display='block';
  document.getElementById('admin-form-section').scrollIntoView({behavior:'smooth'});
}

function hidePostForm(){
  document.getElementById('admin-form-section').style.display='none';
  document.getElementById('edit-id').value='';
}

function editPost(id){
  var p=blogPosts.find(function(x){ return x.id===id; });
  if(!p) return;
  document.getElementById('post-title').value=p.title;
  document.getElementById('post-tag').value=p.tag;
  document.getElementById('post-body').value=p.body;
  document.getElementById('post-img').value=p.img||'';
  var preview=document.getElementById('img-preview');
  var previewEl=document.getElementById('img-preview-el');
  if(p.img){ previewEl.src=p.img; preview.style.display='block'; }
  else { preview.style.display='none'; }
  document.getElementById('edit-id').value=id;
  document.getElementById('form-section-title').textContent='Editar post';
  document.getElementById('publish-btn').textContent='Salvar alterações';
  document.getElementById('admin-form-section').style.display='block';
  document.getElementById('admin-form-section').scrollIntoView({behavior:'smooth'});
}

function deletePost(id){
  if(!sb){ alert('Supabase não conectado.'); return; }
  sb.from('posts').delete().eq('id', id)
    .then(function(res){ if(res.error){ alert('Erro: '+res.error.message); return; } loadPosts(); });
}

async function publishPost(){
  var title  = document.getElementById('post-title').value.trim();
  var tag    = document.getElementById('post-tag').value.trim() || 'Blog';
  var body   = document.getElementById('post-body').value.trim();
  var img    = document.getElementById('post-img').value.trim();
  var editId = document.getElementById('edit-id').value;
  var btn    = document.getElementById('publish-btn');
  var fileEl = document.getElementById('post-img-file');
  var file   = fileEl ? fileEl.files[0] : null;

  if(!title || !body){ alert('Preencha título e texto.'); return; }
  if(!sb){ alert('Supabase não conectado.'); return; }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    if(file){
      btn.textContent = 'Enviando imagem...';
      var path = 'posts/' + Date.now() + '_' + file.name;
      var { error: upErr } = await sb.storage.from('media').upload(path, file);
      if(upErr) throw upErr;
      img = sb.storage.from('media').getPublicUrl(path).data.publicUrl;
    }
    var dateStr = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
    var data = { title:title, tag:tag, body:body, img:img };
    if(editId){
      var orig = blogPosts.find(function(p){ return p.id===editId; });
      data.date = orig ? orig.date : dateStr;
      var { error } = await sb.from('posts').update(data).eq('id', editId);
      if(error) throw error;
    } else {
      data.date = dateStr;
      var { error } = await sb.from('posts').insert(data);
      if(error) throw error;
    }
    hidePostForm();
    loadPosts();
  } catch(e){
    alert('Erro: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = editId ? 'Salvar alterações' : 'Publicar post';
  }
}

function renderAdminList(){
  var el=document.getElementById('admin-post-list');
  if(!el) return;
  el.innerHTML='';
  if(!blogPosts.length){
    var msg=document.createElement('p');
    msg.style.cssText='font-size:13px;color:#7A7A7A;padding:24px 0;';
    msg.textContent='Nenhum post publicado ainda. Clique em "+ Novo post" para começar.';
    el.appendChild(msg);
    return;
  }
  blogPosts.forEach(function(p){
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid #E8E8E8;gap:16px;';
    var info=document.createElement('div');
    info.style.cssText='flex:1;min-width:0;';
    info.innerHTML='<p style="font-size:14px;font-weight:500;color:#0A0A0A;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+p.title+'</p><p style="font-size:11px;color:#7A7A7A;">'+p.tag+' &middot; '+p.date+'</p>';
    var btns=document.createElement('div');
    btns.style.cssText='display:flex;gap:8px;flex-shrink:0;';
    var editBtn=document.createElement('button');
    editBtn.textContent='Editar';
    editBtn.style.cssText='background:#0A0A0A;color:#FFF;border:none;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:10px 18px;cursor:pointer;';
    (function(pid){ editBtn.onclick=function(){ editPost(pid); }; })(p.id);
    var delBtn=document.createElement('button');
    delBtn.textContent='Remover';
    delBtn.style.cssText='background:none;border:1px solid #B0B0B0;color:#7A7A7A;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:10px 18px;cursor:pointer;';
    (function(pid){ delBtn.onclick=function(){ deletePost(pid); }; })(p.id);
    btns.appendChild(editBtn);
    btns.appendChild(delBtn);
    row.appendChild(info);
    row.appendChild(btns);
    el.appendChild(row);
  });
}

function renderBlogGrid(){
  var grid=document.getElementById('blog-grid');
  if(!grid) return;
  grid.innerHTML='';
  if(!blogPosts.length){
    grid.innerHTML='<div class="blog-empty" style="grid-column:1/-1;text-align:center;padding:80px 0;"><h3>Nenhum post publicado ainda.</h3><p>Em breve publicaremos conteúdos sobre identidade visual, marca e estratégia.</p></div>';
    return;
  }
  blogPosts.forEach(function(p){
    var card=document.createElement('div');
    card.className='blog-card';
    (function(pid){ card.onclick=function(){ openPost(pid); }; })(p.id);
    var imgTag=p.img?'<img src="'+p.img+'" alt="'+p.title+'" loading="lazy" onerror="this.style.display=\'none\'">':'<div class="blog-thumb-ph"><span>'+p.tag+'</span></div>';
    var excerpt=p.body.split('\n\n')[0].slice(0,120);
    card.innerHTML='<div class="blog-thumb">'+imgTag+'</div><p class="blog-tag-pill">'+p.tag+'</p><p class="blog-card-title">'+p.title+'</p><p class="blog-card-excerpt">'+excerpt+'...</p>';
    grid.appendChild(card);
  });
}

function openPost(id){
  var p=blogPosts.find(function(x){ return x.id===id; });
  if(!p) return;
  var paras=p.body.split('\n\n').map(function(t){ return '<p>'+t.replace(/\n/g,'<br/>')+'</p>'; }).join('');
  document.getElementById('post-content').innerHTML=
    '<a class="post-back" onclick="showBlogList()">Voltar ao Conteúdos</a>'+
    '<p class="post-tag">'+p.tag+'</p>'+
    '<h1 class="post-title">'+p.title+'</h1>'+
    '<p class="post-meta">Publicado em '+p.date+'</p>'+
    (p.img?'<img class="post-img" src="'+p.img+'" alt="'+p.title+'" loading="lazy"/>':'')+
    '<div class="post-body">'+paras+'</div>';
  var postUrl   = window.location.origin + '/conteudos#post-' + id;
  var urlEnc    = encodeURIComponent(postUrl);
  var titleEnc  = encodeURIComponent(p.title);
  var shareBlock = '<div class="post-share">'
    + '<p class="post-share-label">Compartilhe</p>'
    + '<div class="post-share-btns">'
    + '<button class="share-btn share-copy" id="share-copy-btn" onclick="copyPostLink()">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copiar link</button>'
    + '<a class="share-btn share-linkedin" href="https://www.linkedin.com/sharing/share-offsite/?url=' + urlEnc + '" target="_blank" rel="noopener">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>LinkedIn</a>'
    + '<a class="share-btn share-whatsapp" href="https://wa.me/?text=' + titleEnc + '%20' + urlEnc + '" target="_blank" rel="noopener">'
    + '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>WhatsApp</a>'
    + '</div></div>';

  window._currentPostUrl = postUrl;

  document.getElementById('post-content').innerHTML =
    '<a class="post-back" onclick="showBlogList()">Voltar ao Conteúdos</a>'
    + '<p class="post-tag">' + p.tag + '</p>'
    + '<h1 class="post-title">' + p.title + '</h1>'
    + '<p class="post-meta">Publicado em ' + p.date + '</p>'
    + (p.img ? '<img class="post-img" src="' + p.img + '" alt="' + p.title + '" loading="lazy"/>' : '')
    + '<div class="post-body">' + paras + '</div>'
    + shareBlock;

  document.getElementById('blog-list-view').style.display='none';
  document.getElementById('blog-post-view').style.display='block';
  window.scrollTo(0,0);
}

function copyPostLink(){
  var url = window._currentPostUrl || window.location.href;
  var btn = document.getElementById('share-copy-btn');
  navigator.clipboard.writeText(url).then(function(){
    if(btn){ btn.textContent = 'Link copiado!'; setTimeout(function(){ btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copiar link'; }, 2500); }
  }).catch(function(){ prompt('Copie o link:', url); });
}

function showBlogList(){
  var lv=document.getElementById('blog-list-view');
  var pv=document.getElementById('blog-post-view');
  if(lv) lv.style.display='block';
  if(pv) pv.style.display='none';
}

// ── IMAGE FILE READER ─────────────────────────────────────────────────────────
document.addEventListener('change', function(e){
  if(e.target&&e.target.id==='post-img-file'){
    var file=e.target.files[0];
    if(!file) return;
    var reader=new FileReader();
    reader.onload=function(ev){
      document.getElementById('post-img').value=ev.target.result;
      var preview=document.getElementById('img-preview');
      var previewEl=document.getElementById('img-preview-el');
      previewEl.src=ev.target.result;
      preview.style.display='block';
    };
    reader.readAsDataURL(file);
  }
});

// ── CONTACT FORM ──────────────────────────────────────────────────────────────
function submitForm(e){
  e.preventDefault();
  var nome    = (document.getElementById('c-nome')||{value:''}).value.trim();
  var empresa = (document.getElementById('c-empresa')||{value:''}).value.trim();
  var site    = (document.getElementById('c-site')||{value:''}).value.trim();
  var faz     = (document.getElementById('c-faz')||{value:''}).value.trim();
  var porque  = (document.getElementById('c-porque')||{value:''}).value.trim();
  var msg     = document.getElementById('form-msg');
  var btn     = document.getElementById('form-submit-btn');

  function showMsg(text, ok){
    if(!msg) return;
    msg.style.display='block';
    msg.style.background = ok ? '#f0faf0' : '#fff3f3';
    msg.style.color      = ok ? '#1a7a1a' : '#c00';
    msg.textContent = text;
  }

  if(!nome){ showMsg('Por favor, preencha seu nome.',false); return; }

  if(btn){ btn.disabled=true; btn.textContent='Enviando...'; }
  if(msg){ msg.style.display='none'; }

  var data = new FormData();
  // ⚠️  Crie sua chave gratuita em https://web3forms.com e substitua abaixo
  data.append('access_key','COLOQUE_SUA_CHAVE_WEB3FORMS_AQUI');
  data.append('subject','Proposta - '+(empresa||nome));
  data.append('from_name','Jeito Design Site');
  data.append('Nome', nome);
  data.append('Empresa', empresa||'—');
  data.append('Site_Instagram', site||'—');
  data.append('O_que_faz', faz||'—');
  data.append('Por_que_agora', porque||'—');

  fetch('https://api.web3forms.com/submit',{method:'POST',body:data})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(btn){ btn.disabled=false; btn.textContent='Solicitar proposta'; }
      if(d.success){
        showMsg('Mensagem enviada! Entraremos em contato em até 2 dias úteis.',true);
        ['c-nome','c-empresa','c-site','c-faz','c-porque'].forEach(function(id){
          var el=document.getElementById(id); if(el) el.value='';
        });
      } else {
        showMsg('Erro ao enviar. Tente em contato@jeitodesign.com.br',false);
      }
    })
    .catch(function(){
      if(btn){ btn.disabled=false; btn.textContent='Solicitar proposta'; }
      showMsg('Erro de conexão. Envie para contato@jeitodesign.com.br',false);
    });
}

// ── ADMIN TABS ───────────────────────────────────────────────────────────────
function switchAdminTab(tab){
  var tPosts = document.getElementById('admin-tab-posts');
  var tProj  = document.getElementById('admin-tab-projetos');
  var bPosts = document.getElementById('tab-posts-btn');
  var bProj  = document.getElementById('tab-projetos-btn');
  var isPost = tab === 'posts';
  tPosts.style.display = isPost ? 'block' : 'none';
  tProj.style.display  = isPost ? 'none'  : 'block';
  bPosts.style.background = isPost ? 'var(--black)' : 'none';
  bPosts.style.color      = isPost ? 'var(--white)' : 'var(--black)';
  bProj.style.background  = isPost ? 'none' : 'var(--black)';
  bProj.style.color       = isPost ? 'var(--black)' : 'var(--white)';
}

// ── PROJECTS (Firestore) ─────────────────────────────────────────────────────
var siteProjects = [];

function loadProjects(callback) {
  if (!sb) { if(callback) callback(); return; }
  sb.from('projetos').select('*').order('created_at', { ascending: false })
    .then(function(res) {
      if(res.error){ console.warn('loadProjects:', res.error); if(callback) callback(); return; }
      siteProjects = (res.data||[]).map(function(d){
        return { id:d.id, nome:d.titulo||d.nome||'', tipo:d.tipo||'', descricao:d.descricao||'', img:d.imagem||d.img||'' };
      });
      renderProjectsGrid();
      renderAdminProjectList();
      if(callback) callback();
    });
}

function renderProjectsGrid(){
  var grid = document.getElementById('proj-grid-full');
  if(!grid) return;
  grid.innerHTML = '';
  if(!siteProjects.length){
    var empty = document.createElement('div');
    empty.className = 'proj-full-card wide';
    empty.innerHTML = '<div class="proj-full-ph"><p class="pf-n">Portfólio</p><p class="pf-t">Em breve</p><p class="pf-s">Identidade Visual Estratégica</p></div><div class="proj-full-ov"><p class="pov-t">Portfólio em construção</p><p class="pov-d">Em breve novos projetos serão adicionados</p></div>';
    grid.appendChild(empty);
    return;
  }
  siteProjects.forEach(function(p, idx){
    var card = document.createElement('div');
    card.className = 'proj-full-card' + (idx === 0 ? ' wide' : '');
    var imgHtml = p.img
      ? '<img src="'+p.img+'" alt="'+p.nome+'" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">'
      : '<div class="proj-full-ph"><p class="pf-n">'+p.tipo+'</p><p class="pf-t">'+p.nome+'</p><p class="pf-s">'+p.descricao+'</p></div>';
    card.innerHTML = imgHtml
      + '<div class="proj-full-ov"><p class="pov-l">'+p.tipo+'</p><p class="pov-t">'+p.nome+'</p><p class="pov-d">'+p.descricao+'</p></div>';
    grid.appendChild(card);
  });
  // Update home & servico 3-card preview
  document.querySelectorAll('.g3').forEach(function(grid){
    if(!grid.querySelector('.proj-card') && !grid.querySelector('.proj-ph')) return;
    grid.innerHTML = '';
    var items = siteProjects.length ? siteProjects.slice(0,3) : [{nome:'Case 01'},{nome:'Case 02'},{nome:'Case 03'}];
    items.forEach(function(p){
      var c = document.createElement('div');
      c.className = 'proj-card';
      c.innerHTML = (p.img ? '<img src="'+p.img+'" alt="'+p.nome+'" loading="lazy" style="width:100%;height:100%;object-fit:cover;">' : '<div class="proj-ph"><p>'+(p.nome||'Case')+'</p></div>')
        + '<div class="proj-ov"><p>Ver projeto</p></div>';
      grid.appendChild(c);
    });
  });
}

function renderAdminProjectList(){
  var el = document.getElementById('admin-project-list');
  if(!el) return;
  el.innerHTML = '';
  if(!siteProjects.length){
    var msg = document.createElement('p');
    msg.style.cssText = 'font-size:13px;color:#7A7A7A;padding:24px 0;';
    msg.textContent = 'Nenhum projeto ainda. Clique em "+ Novo projeto" para começar.';
    el.appendChild(msg);
    return;
  }
  siteProjects.forEach(function(p){
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid #E8E8E8;gap:16px;';
    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;display:flex;align-items:center;gap:16px;';
    if(p.img){
      var th = document.createElement('img');
      th.src = p.img;
      th.style.cssText = 'width:56px;height:40px;object-fit:cover;flex-shrink:0;';
      info.appendChild(th);
    }
    var txt = document.createElement('div');
    txt.style.cssText = 'min-width:0;';
    txt.innerHTML = '<p style="font-size:14px;font-weight:500;color:#0A0A0A;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+p.nome+'</p>'
      + '<p style="font-size:11px;color:#7A7A7A;">'+p.tipo+'</p>';
    info.appendChild(txt);
    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;flex-shrink:0;';
    var eBtn = document.createElement('button');
    eBtn.textContent = 'Editar';
    eBtn.style.cssText = 'background:#0A0A0A;color:#FFF;border:none;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:10px 18px;cursor:pointer;';
    (function(pid){ eBtn.onclick = function(){ editProject(pid); }; })(p.id);
    var dBtn = document.createElement('button');
    dBtn.textContent = 'Remover';
    dBtn.style.cssText = 'background:none;border:1px solid #B0B0B0;color:#7A7A7A;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:10px 18px;cursor:pointer;';
    (function(pid){ dBtn.onclick = function(){ deleteProject(pid); }; })(p.id);
    btns.appendChild(eBtn); btns.appendChild(dBtn);
    row.appendChild(info); row.appendChild(btns);
    el.appendChild(row);
  });
}

function showNewProjectForm(){
  document.getElementById('proj-title').value='';
  document.getElementById('proj-tipo').value='';
  document.getElementById('proj-desc').value='';
  document.getElementById('proj-img').value='';
  document.getElementById('proj-img-preview').style.display='none';
  document.getElementById('proj-edit-id').value='';
  document.getElementById('proj-form-title').textContent='Novo projeto';
  document.getElementById('proj-publish-btn').textContent='Adicionar projeto';
  document.getElementById('proj-form-section').style.display='block';
  document.getElementById('proj-form-section').scrollIntoView({behavior:'smooth'});
}

function hideProjectForm(){
  document.getElementById('proj-form-section').style.display='none';
  document.getElementById('proj-edit-id').value='';
}

function editProject(id){
  var p = siteProjects.find(function(x){ return x.id===id; });
  if(!p) return;
  document.getElementById('proj-title').value  = p.nome;
  document.getElementById('proj-tipo').value   = p.tipo;
  document.getElementById('proj-desc').value   = p.descricao;
  document.getElementById('proj-img').value    = p.img||'';
  var preview = document.getElementById('proj-img-preview');
  var previewEl = document.getElementById('proj-img-preview-el');
  if(p.img){ previewEl.src=p.img; preview.style.display='block'; }
  else { preview.style.display='none'; }
  document.getElementById('proj-edit-id').value = id;
  document.getElementById('proj-form-title').textContent = 'Editar projeto';
  document.getElementById('proj-publish-btn').textContent = 'Salvar projeto';
  document.getElementById('proj-form-section').style.display='block';
  document.getElementById('proj-form-section').scrollIntoView({behavior:'smooth'});
}

function deleteProject(id){
  if(!sb){ alert('Supabase não conectado.'); return; }
  sb.from('projetos').delete().eq('id', id)
    .then(function(res){ if(res.error){ alert('Erro: '+res.error.message); return; } loadProjects(); });
}

async function publishProject(){
  var nome   = document.getElementById('proj-title').value.trim();
  var tipo   = document.getElementById('proj-tipo').value.trim() || 'Identidade Visual';
  var desc   = document.getElementById('proj-desc').value.trim();
  var editId = document.getElementById('proj-edit-id').value;
  var btn    = document.getElementById('proj-publish-btn');
  var fileEl = document.getElementById('proj-img-file');
  var file   = fileEl ? fileEl.files[0] : null;

  if(!nome){ alert('Preencha o nome do projeto.'); return; }
  if(!editId && !file){ alert('Selecione uma imagem para o projeto.'); return; }
  if(!sb){ alert('Supabase não conectado.'); return; }

  btn.disabled = true;
  btn.textContent = file ? 'Enviando imagem...' : 'Salvando...';

  try {
    var imgUrl = document.getElementById('proj-img').value || '';
    if(file){
      var path = 'projetos/' + Date.now() + '_' + file.name;
      var { error: upErr } = await sb.storage.from('media').upload(path, file);
      if(upErr) throw upErr;
      imgUrl = sb.storage.from('media').getPublicUrl(path).data.publicUrl;
    }
    var data = { titulo:nome, tipo:tipo, descricao:desc, imagem:imgUrl };
    if(editId){
      var { error } = await sb.from('projetos').update(data).eq('id', editId);
      if(error) throw error;
    } else {
      var { error } = await sb.from('projetos').insert(data);
      if(error) throw error;
    }
    hideProjectForm();
    loadProjects();
  } catch(e){
    alert('Erro: ' + e.message);
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = editId ? 'Salvar projeto' : 'Adicionar projeto';
  }
}

// File reader for project image
document.addEventListener('change', function(e){
  if(e.target && e.target.id==='proj-img-file'){
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      document.getElementById('proj-img').value = ev.target.result;
      document.getElementById('proj-img-preview-el').src = ev.target.result;
      document.getElementById('proj-img-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// ── EMAILJS: ENVIO DE FORMULÁRIO ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  const formContato = document.getElementById('form-contato');
  
  if(formContato) {
    formContato.addEventListener('submit', function(event) {
      event.preventDefault(); // Impede a página de recarregar
      
      const btnEnviar = document.getElementById('btn-enviar');
      const textoOriginal = btnEnviar.innerText;
      
      // Muda o texto do botão para mostrar que está carregando
      btnEnviar.innerText = 'Enviando...';
      btnEnviar.disabled = true;

      // ATENÇÃO: Substitua pelos seus IDs gerados no passo 1
      const serviceID = 'service_sn6e8xg';
      const templateID = 'template_u4i4ypt';

      // Dispara o e-mail
      emailjs.sendForm('service_sn6e8xg', 'template_u4i4ypt', this)
        .then(function() {
          alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
          formContato.reset(); // Limpa os campos do formulário
          btnEnviar.innerText = textoOriginal;
          btnEnviar.disabled = false;
        }, function(error) {
          alert('Ops! Ocorreu um erro ao enviar. Tente novamente mais tarde.');
          console.log('Erro do EmailJS:', error);
          btnEnviar.innerText = textoOriginal;
          btnEnviar.disabled = false;
        });
    });
  }
});

// ── ROTEAMENTO /admin ─────────────────────────────────────────────────────────
(function() {
  var PAGE_MAP = {
    '/': 'home', '/home': 'home', '/quemsomos': 'quemsomos',
    '/servico': 'servico', '/projetos': 'projetos',
    '/conteudos': 'conteudos', '/contato': 'contato', '/admin': 'admin'
  };
  var path = location.pathname.replace(/\/+$/, '') || '/';
  var page = PAGE_MAP[path];
  if (page && page !== 'home') {
    document.querySelectorAll('.page').forEach(function(p) {
      p.classList.remove('active');
    });
    var target = document.getElementById('pg-' + page);
    if (target) target.classList.add('active');
  }
})();

// ── INIT ──────────────────────────────────────────────────────────────────────
loadPosts();
loadProjects();
