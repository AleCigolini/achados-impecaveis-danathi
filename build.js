const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

const read = p => fs.readFileSync(p, 'utf-8');
const renderTemplate = (tpl, data) =>
  tpl.replace(/{{(\w+)}}/g, (_, key) => (data[key] !== undefined ? data[key] : ''));

function wrapPage({ title, description, ogImage, content, siteData }) {
  const header = renderTemplate(read(path.join(SRC, 'partials/header.html')), siteData);
  const footer = renderTemplate(read(path.join(SRC, 'partials/footer.html')), siteData);
  const absoluteOgImage = ogImage?.startsWith('http') ? ogImage : `${siteData.siteUrl}${ogImage}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18397788802"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-18397788802');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${absoluteOgImage}">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
${header}
<main>
${content}
</main>
${footer}
</body>
</html>
`;
}

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'produto'), { recursive: true });

  // copia CSS e imagens estáticas
  fs.cpSync(path.join(SRC, 'assets/css'), path.join(DIST, 'css'), { recursive: true });
  fs.cpSync(path.join(SRC, 'assets/img'), path.join(DIST, 'img'), { recursive: true });

  const siteData = JSON.parse(read(path.join(SRC, 'data/site.json')));
  const products = JSON.parse(read(path.join(SRC, 'data/products.json')));

  // HOME — injeta grid de produtos em destaque
  const cardTpl = read(path.join(SRC, 'templates/product-card.html'));
  const cardsHtml = products.map(p => renderTemplate(cardTpl, p)).join('\n');
  const homeContent = read(path.join(SRC, 'pages/home.html'))
    .replace('<!--PRODUCTS_GRID-->', cardsHtml);

  fs.writeFileSync(
    path.join(DIST, 'index.html'),
    wrapPage({
      title: 'Achados Impecáveis da Nathi',
      description: 'Achadinhos selecionados com carinho, direto no seu WhatsApp — moda, casa e beleza com preço que cabe no bolso.',
      ogImage: '/img/og-home.jpg',
      content: renderTemplate(homeContent, siteData),
      siteData
    })
  );

  // ROTAS DE PRODUTO — 1 pasta + index.html por produto
  const produtoTpl = read(path.join(SRC, 'templates/produto.html'));
  for (const product of products) {
    const mergedData = { ...product, ...siteData };
    const content = renderTemplate(produtoTpl, mergedData);
    const outDir = path.join(DIST, 'produto', product.slug);
    fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(
      path.join(outDir, 'index.html'),
      wrapPage({
        title: `${product.name} — Achados Impecáveis`,
        description: product.description,
        ogImage: product.image,
        content,
        siteData
      })
    );
  }

  console.log(`Build ok: home + ${products.length} rota(s) de produto gerada(s) em /dist`);
}

build();
