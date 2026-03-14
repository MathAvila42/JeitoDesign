// 1. CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBxgFZeFlW8BwV3dqYjT-FM6MnB7-2I3lU",
  authDomain: "jeito-design.firebaseapp.com",
  projectId: "jeito-design",
  storageBucket: "jeito-design.firebasestorage.app",
  messagingSenderId: "73892657193",
  appId: "1:73892657193:web:951d0b914dc5a5ea16c438"
};

// 2. INICIAR O FIREBASE
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();      
const storage = firebase.storage();

// --- FUNÇÃO PARA PUBLICAR PROJETOS ---
async function publishProject() {
    // Pegando os elementos da tela
    const title = document.getElementById('proj-title').value;
    const tipo = document.getElementById('proj-tipo').value;
    const desc = document.getElementById('proj-desc').value;
    const file = document.getElementById('proj-img-file').files[0];
    const btn = document.getElementById('proj-publish-btn');

    // Validação simples
    if (!title || !file) {
        alert("Por favor, preencha o título e selecione uma imagem!");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "Enviando para o Google...";

        // 1. Upload da Imagem para o Storage
        const storageRef = storage.ref('projetos/' + Date.now() + "_" + file.name);
        await storageRef.put(file);
        const downloadURL = await storageRef.getDownloadURL();

        // 2. Salvar dados no Firestore
        await db.collection("projetos").add({
            titulo: title,
            tipo: tipo,
            descricao: desc,
            imagem: downloadURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Projeto cadastrado com sucesso! 🎉");
        
        // Limpar campos e fechar form
        document.getElementById('proj-title').value = "";
        document.getElementById('proj-img-file').value = "";
        hideProjectForm(); // Chama a função que você já tem para esconder o form
        
        // Opcional: recarregar a lista (veremos isso a seguir)
        location.reload(); 

    } catch (error) {
        console.error("Erro ao publicar:", error);
        alert("Erro ao salvar projeto. Verifique o console.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Adicionar projeto";
    }
}

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

// ── PROJECTS ADMIN ────────────────────────────────────────────────────────────
var siteProjects = store.get('jeito_projects') || [];

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
  id = Number(id);
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
  id = Number(id);
  siteProjects = siteProjects.filter(function(p){ return p.id!==id; });
  store.set('jeito_projects', siteProjects);
  renderProjectsGrid();
  renderAdminProjectList();
}

function publishProject(){
  var nome   = document.getElementById('proj-title').value.trim();
  var tipo   = document.getElementById('proj-tipo').value.trim()||'Identidade Visual';
  var desc   = document.getElementById('proj-desc').value.trim();
  var img    = document.getElementById('proj-img').value.trim();
  var editId = document.getElementById('proj-edit-id').value;
  if(!nome){ alert('Preencha o nome do projeto.'); return; }
  if(editId){
    var id = Number(editId);
    siteProjects = siteProjects.map(function(p){
      if(p.id===id) return {id:p.id,nome:nome,tipo:tipo,descricao:desc,img:img};
      return p;
    });
  } else {
    siteProjects.unshift({id:Date.now(),nome:nome,tipo:tipo,descricao:desc,img:img});
  }
  store.set('jeito_projects', siteProjects);
  hideProjectForm();
  renderProjectsGrid();
  renderAdminProjectList();
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

// ── INIT ──────────────────────────────────────────────────────────────────────
renderBlogGrid();
