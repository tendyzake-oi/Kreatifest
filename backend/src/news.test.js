import assert from 'node:assert/strict'
import test from 'node:test'
import { getTopic, groupArticles, normalizeArticle, sortAndDedupeArticles } from './news.js'

test('classifies articles across related digital marketing topics', () => {
  assert.equal(getTopic({ title: 'Instagram expands Reels tools' }).key, 'social')
  assert.equal(getTopic({ title: 'A new SEO strategy for search' }).key, 'seo')
  assert.equal(getTopic({ title: 'Marketing teams change their approach' }).key, 'marketing')
})

test('normalizes an RSS article and rejects unsafe or missing links', () => {
  const article = normalizeArticle({
    title: '  Instagram launches a new creator feature via @sejournal, @writer  ',
    contentSnippet: '<p>New tools for creators &amp; brands. The post Article appeared first on Search Engine Journal.</p>',
    link: 'https://example.com/news/creator-feature',
    pubDate: '2026-09-29T08:00:00Z',
  }, 'Example News')

  assert.equal(article.title, 'Instagram launches a new creator feature')
  assert.equal(article.description, 'New tools for creators & brands.')
  assert.equal(article.topicKey, 'social')
  assert.equal(normalizeArticle({ title: 'Unsafe', link: 'javascript:alert(1)' }, 'Example News'), null)
  assert.equal(normalizeArticle({ title: 'Missing link' }, 'Example News'), null)
})

test('normalizes local region and HTTPS image metadata', () => {
  const article = normalizeArticle({
    title: 'Strategi digital marketing untuk bisnis Indonesia',
    contentSnippet: 'Pemasaran digital dan creator marketing.',
    link: 'https://example.com/marketing',
    enclosure: { url: 'https://cdn.example.com/marketing.jpg' },
  }, { name: 'Marketing.co.id', region: 'indonesia' })

  assert.equal(article.region, 'indonesia')
  assert.equal(article.imageUrl, 'https://cdn.example.com/marketing.jpg')
  assert.equal(article.topicKey, 'content')

  const unsafeImage = normalizeArticle({
    title: 'SEO update',
    link: 'https://example.com/seo',
    enclosure: { url: 'http://cdn.example.com/seo.jpg' },
  }, { name: 'International', region: 'international' })
  assert.equal(unsafeImage.imageUrl, null)
})

  test('uses DailySocial enclosure images and skips the newsletter greeting in excerpts', () => {
    const article = normalizeArticle({
      title: 'E-Commerce Marketing Trends for Indonesia',
      contentSnippet: 'Dear subscriber,',
      content: '<p>Dear subscriber,</p><p>Digital commerce teams are testing new creator campaigns.</p>',
      link: 'https://dailysocial.id/p/ecommerce-marketing',
      enclosure: { url: 'https://cdn.example.com/ecommerce.jpg' },
    }, { name: 'DailySocial', region: 'indonesia' })

    assert.equal(article.source, 'DailySocial')
    assert.equal(article.region, 'indonesia')
    assert.equal(article.imageUrl, 'https://cdn.example.com/ecommerce.jpg')
    assert.match(article.description, /^Digital commerce teams/)
  })
test('rejects unrelated articles when publisher boilerplate mentions marketing', () => {
  const unrelatedArticle = normalizeArticle({
    title: 'Menutup Kesenjangan Perlindungan Asuransi di Indonesia',
    description: '<p>Marketing.co.id - Berita Financial Services | Perlindungan asuransi digital.</p>',
    categories: ['FINANCIAL SERVICES', 'asuransi digital', 'insurtech'],
    link: 'https://marketing.co.id/menutup-kesenjangan-asuransi/',
  }, { name: 'Marketing.co.id', region: 'indonesia' })

  assert.equal(unrelatedArticle, null)
})

test('deduplicates articles and orders newest first', () => {
  const olderArticle = {
    url: 'https://example.com/older',
    publishedAt: '2026-09-28T08:00:00.000Z',
  }
  const newerArticle = {
    url: 'https://example.com/newer',
    publishedAt: '2026-09-29T08:00:00.000Z',
  }

  assert.deepEqual(
    sortAndDedupeArticles([olderArticle, newerArticle, olderArticle]),
    [newerArticle, olderArticle],
  )
})

test('groups newest articles independently by region', () => {
  const grouped = groupArticles([
    { region: 'international', id: 'international-newest' },
    { region: 'indonesia', id: 'indonesia-newest' },
    { region: 'indonesia', id: 'indonesia-older' },
  ], 1)

  assert.deepEqual(grouped, {
    indonesia: [{ region: 'indonesia', id: 'indonesia-newest' }],
    international: [{ region: 'international', id: 'international-newest' }],
  })
})