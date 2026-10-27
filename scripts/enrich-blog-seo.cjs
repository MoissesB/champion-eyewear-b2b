const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const origin = 'https://champion-innova.com';
const posts = JSON.parse(fs.readFileSync(path.join(root, 'data/blog-posts.json'), 'utf8')).posts;
const additions = [
  {
    file: 'blog.html',
    url: `${origin}/blog.html`,
    image: `${origin}/${posts[0].image}`,
    alt: 'Lentes de sol Champion para ópticas',
    schema: {
      '@context': 'https://schema.org', '@type': 'CollectionPage',
      name: 'Blog B2B de lentes de sol | Champion Eyewear',
      url: `${origin}/blog.html`, inLanguage: 'es-419',
      image: `${origin}/${posts[0].image}`,
      isPartOf: { '@type': 'WebSite', name: 'Champion Eyewear', url: origin },
    },
  },
  ...posts.map((post) => ({
    file: `blog/${post.slug}.html`,
    url: `${origin}/blog/${post.slug}.html`,
    image: `${origin}/${post.image}`,
    alt: `${post.model} Champion Eyewear`,
    schema: {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: post.title, description: post.description,
      mainEntityOfPage: `${origin}/blog/${post.slug}.html`,
      url: `${origin}/blog/${post.slug}.html`, inLanguage: 'es-419',
      image: `${origin}/${post.image}`,
      author: { '@type': 'Organization', name: 'Champion Eyewear' },
      publisher: { '@type': 'Organization', name: 'Champion Eyewear', url: origin },
    },
  })),
];

for (const item of additions) {
  const file = path.join(root, item.file);
  let html = fs.readFileSync(file, 'utf8');
  const block = `<!-- champion-seo:start -->\n  <meta property="og:url" content="${item.url}">\n  <meta property="og:image:alt" content="${item.alt}">\n  <script type="application/ld+json">${JSON.stringify(item.schema).replace(/</g, '\\u003c')}</script>\n  <!-- champion-seo:end -->`;
  if (html.includes('<!-- champion-seo:start -->')) {
    html = html.replace(/<!-- champion-seo:start -->[\s\S]*?<!-- champion-seo:end -->/, block);
  } else {
    html = html.replace('</head>', `${block}\n</head>`);
  }
  fs.writeFileSync(file, html, 'utf8');
}
console.log(`blog-seo-ok (${additions.length} pages)`);
