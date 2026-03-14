// ── CONSTANTS ────────────────────────────────────────────────────────────────
const PAGES = ['home','jeito','servico','projetos','conteudos','contato','admin'];
const PAGE_MAP = {
  '/':'home', '/home':'home', '/jeito':'jeito', '/servico':'servico',
  '/projetos':'projetos', '/conteudos':'conteudos', '/contato':'contato',
  '/admin':'admin'
};
let currentPage = 'home';

// ── STORAGE ───────────────────────────────────────────────────────────────────
const store = {
  get: function(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } },
  set: function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
};

// ── CURSOR ────────────────────────────────────────────────────────────────────
(function(){
  var cur = document.getElementById('cur');
  var curR = document.getElementById('cur-r');
  if (!cur) return;
  document.addEventListener('mousemove', function(e){
    cur.style.left = e.clientX+'px';
    cur.style.top = e.clientY+'px';
    setTimeout(function(){ curR.style.left=e.clientX+'px'; curR.style.top=e.clientY+'px'; }, 90);
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if(el){
      var node=el, dark=false;
      while(node && node!==document.body){
        var bg=window.getComputedStyle(node).backgroundColor;
        var m=bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if(m){ var r=+m[1],g=+m[2],b=+m[3]; if(r<30&&g<30&&b<30){dark=true;break;} }
        node=node.parentElement;
      }
      document.body.classList.toggle('cur-inv',dark);
    }
  });
})();

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

// ── BLOG ──────────────────────────────────────────────────────────────────────
var blogPosts = store.get('jeito_posts') || [];
var adminLoggedIn = false;

function adminLogin(){
  var pw = document.getElementById('admin-pw').value;
  if(pw === 'jeito2024'){
    adminLoggedIn = true;
    document.getElementById('admin-login-wrap').style.display = 'none';
    document.getElementById('admin-panel-wrap').style.display = 'block';
    renderAdminList();
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
  id=Number(id);
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
  id=Number(id);
  blogPosts=blogPosts.filter(function(p){ return p.id!==id; });
  store.set('jeito_posts',blogPosts);
  renderBlogGrid();
  renderAdminList();
}

function publishPost(){
  var title=document.getElementById('post-title').value.trim();
  var tag=document.getElementById('post-tag').value.trim()||'Blog';
  var body=document.getElementById('post-body').value.trim();
  var img=document.getElementById('post-img').value.trim();
  var editId=document.getElementById('edit-id').value;
  if(!title||!body){ alert('Preencha título e texto.'); return; }
  if(editId){
    var id=Number(editId);
    blogPosts=blogPosts.map(function(p){
      if(p.id===id) return {id:p.id,title:title,tag:tag,body:body,img:img,date:p.date};
      return p;
    });
  } else {
    blogPosts.unshift({
      id:Date.now(),title:title,tag:tag,body:body,img:img,
      date:new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
    });
  }
  store.set('jeito_posts',blogPosts);
  hidePostForm();
  renderBlogGrid();
  renderAdminList();
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
  id=Number(id);
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
  document.getElementById('blog-list-view').style.display='none';
  document.getElementById('blog-post-view').style.display='block';
  window.scrollTo(0,0);
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
  var inputs=document.querySelectorAll('#pg-contato .form-i, #pg-contato .form-ta');
  var vals=Array.from(inputs).map(function(i){ return i.value.trim(); });
  var nome=vals[0],empresa=vals[1],site=vals[2],faz=vals[3],porque=vals[4];
  if(!nome){ alert('Por favor, preencha seu nome.'); return; }
  var subject=encodeURIComponent('Proposta - '+(empresa||nome));
  var body=encodeURIComponent('Nome: '+nome+'\nEmpresa: '+(empresa||'—')+'\nSite/Instagram: '+(site||'—')+'\n\nO que faz:\n'+(faz||'—')+'\n\nPor que agora:\n'+(porque||'—'));
  window.location.href='mailto:contato@jeitodesign.com.br?subject='+subject+'&body='+body;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
renderBlogGrid();
