# Jeito Design — Site Oficial

Estúdio de identidade visual estratégica.
**https://www.jeitodesign.com.br**

---

## Estrutura do projeto

```
/
├── index.html          ← SPA principal (todas as páginas)
├── vercel.json         ← Configuração Vercel (rotas, headers, cache)
├── robots.txt          ← SEO crawling rules
├── sitemap.xml         ← Mapa do site para indexação
├── site.webmanifest    ← PWA manifest
├── css/
│   └── style.css       ← Todos os estilos
├── js/
│   └── main.js         ← Toda a lógica (SPA, blog, admin)
└── images/
    ├── logo-branco.png     ← Logo branca (fundos escuros)
    ├── logo-preto.png      ← Logo preta (fundos claros)
    ├── favicon-32.png      ← Favicon 32×32
    ├── favicon-16.png      ← Favicon 16×16
    ├── apple-touch-icon.png ← iOS icon 180×180
    └── og-image.jpg        ← Open Graph 1200×630
```

---

## Deploy no Vercel

### Opção 1 — GitHub + Vercel (recomendado)

```bash
# 1. Criar repositório no GitHub
git init
git add .
git commit -m "feat: site jeito design v1"
git remote add origin https://github.com/SEU_USUARIO/jeito-design.git
git push -u origin main

# 2. No Vercel:
# → New Project → Import Git Repository → jeito-design
# → Framework Preset: Other
# → Root Directory: /  (padrão)
# → Deploy
```

### Opção 2 — Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

---

## Admin do Blog

Acesso **exclusivo** via URL:
```
https://www.jeitodesign.com.br/admin
```

Senha: `jeito2024` ← **Altere antes de publicar em produção**

Para trocar a senha, edite a linha em `js/main.js`:
```js
if(pw === 'jeito2024'){
```

---

## Imagens necessárias (adicionar antes do deploy)

Coloque na pasta `/images/`:

| Arquivo | Tamanho | Uso |
|---|---|---|
| `logo-branco.png` | ~300×90px | Navbar, footer |
| `logo-preto.png` | ~300×90px | Fallback claro |
| `og-image.jpg` | 1200×630px | Compartilhamento social |
| `favicon-32.png` | 32×32px | Aba do browser |
| `favicon-16.png` | 16×16px | Aba do browser pequena |
| `apple-touch-icon.png` | 180×180px | iOS bookmark |

---

## Páginas e URLs

| Página | URL |
|---|---|
| Home | `https://www.jeitodesign.com.br/` |
| Jeito | `https://www.jeitodesign.com.br/jeito` |
| Serviço | `https://www.jeitodesign.com.br/servico` |
| Projetos | `https://www.jeitodesign.com.br/projetos` |
| Conteúdos | `https://www.jeitodesign.com.br/conteudos` |
| Contato | `https://www.jeitodesign.com.br/contato` |
| Admin | `https://www.jeitodesign.com.br/admin` |

---

## SEO

- Schema.org: `ProfessionalService` + `CreativeAgency`
- Open Graph completo
- Twitter Cards
- Sitemap XML automático
- robots.txt bloqueando `/admin`
- Canonical URLs
- Fonts com `display=swap` e `preload`
- Lazy loading em todas as imagens
- Cache headers: CSS/JS/Images com `max-age=1 ano`

---

## Palavras-chave otimizadas

- identidade visual estratégica
- estúdio de branding
- criação de identidade visual
- branding para empresas
- designer de marca
- estúdio de design estratégico
- identidade visual para empresas brasileiras
