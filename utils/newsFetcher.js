const https = require('https');
const http = require('http');

const RSS_FEEDS = {
  sports: [
    { name: 'Kompas Sport', url: 'https://www.kompas.com/rss/sport' },
    { name: 'Detik Sport', url: 'https://www.detik.com/olahraga/rss' },
    { name: 'CNN Indonesia Sport', url: 'https://www.cnnindonesia.com/sport/rss' },
  ],
  politics: [
    { name: 'Kompas News', url: 'https://www.kompas.com/rss/news' },
    { name: 'Detik News', url: 'https://www.detik.com/nasional/rss' },
    { name: 'CNN Indonesia Politics', url: 'https://www.cnnindonesia.com/nasional/politik/rss' },
  ],
  criminal: [
    { name: 'Kompas Crime', url: 'https://www.kompas.com/rss/news/megapolitan' },
    { name: 'Detik Crime', url: 'https://www.detik.com/berita-hukum/rss' },
    { name: 'CNN Indonesia Crime', url: 'https://www.cnnindonesia.com/nasional/hukum-kriminal/rss' },
  ],
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

function extractCDATA(str) {
  if (!str) return '';
  const match = str.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return match ? match[1].trim() : str.trim();
}

function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const imageMatch = itemXml.match(/<media:content[^>]*url="([^"]*)"/i) ||
                       itemXml.match(/<enclosure[^>]*url="([^"]*)"/i) ||
                       itemXml.match(/<img[^>]*src="([^"]*)"/i);
    const title = escapeHtml(extractCDATA(titleMatch ? titleMatch[1] : ''));
    const description = escapeHtml(extractCDATA(descMatch ? descMatch[1] : ''));
    const link = escapeHtml(extractCDATA(linkMatch ? linkMatch[1] : ''));
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : null;
    const imageUrl = imageMatch ? imageMatch[1] : null;

    if (title && title.length > 5) {
      items.push({
        title,
        content: description.substring(0, 5000),
        url: link,
        published_at: pubDate ? new Date(pubDate) : new Date(),
        image_url: imageUrl,
      });
    }
  }
  return items;
}

function detectCategory(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const sportsKeywords = ['olahraga', 'sepak bola', 'timnas', 'liga', 'pertandingan', 'gol', 'pemain', 'pelatih', 'turnamen', 'juara', 'medali', 'atlet', 'tenis', 'basket', 'badminton', 'motogp', 'formula', 'basketball', 'football', 'soccer', 'sport', 'match', 'player', 'coach', 'tournament', 'champion', 'medal', 'athlete', 'world cup', 'piala dunia', 'liga 1', 'bri liga', 'shopee liga', 'aff', 'sea games', 'asian games', 'olympic', 'olimpiade'];
  const politicsKeywords = ['politik', 'pemerintah', 'presiden', 'menteri', 'dpr', 'dpr ri', 'mpr', 'bupati', 'gubernur', 'walikota', 'pilkada', 'pemilu', 'politisi', 'partai', 'koalisi', 'oposisi', 'undang-undang', 'peraturan', 'kebijakan', 'anggaran', 'dpd', 'kpu', 'bawaslu', 'mk', 'mahkamah konstitusi', 'corruption', 'korupsi', 'eksekutif', 'legislatif', 'yudikatif', 'demokrasi', 'hak angket', 'interpelasi', 'pencalonan'];
  const criminalKeywords = ['kriminal', 'kejahatan', 'polisi', 'tersangka', 'penjahat', 'curas', 'curanmor', 'narkoba', 'pembunuhan', 'pencurian', 'penipuan', 'penggelapan', 'perampokan', 'begal', 'razia', 'ditangkap', 'dihadiri', 'tersangka', 'ditahan', 'vonis', 'hukuman', 'penjara', 'tindak pidana', 'crime', 'criminal', 'arrest', 'police', 'suspect', 'murder', 'theft', 'fraud', 'drug', 'robbery', 'assault', 'kidnapping', 'bribery', 'corruption case'];

  const scores = { sports: 0, politics: 0, criminal: 0 };
  for (const kw of sportsKeywords) if (text.includes(kw)) scores.sports++;
  for (const kw of politicsKeywords) if (text.includes(kw)) scores.politics++;
  for (const kw of criminalKeywords) if (text.includes(kw)) scores.criminal++;

  const max = Math.max(scores.sports, scores.politics, scores.criminal);
  if (max === 0) return 'politics';
  if (scores.sports === max) return 'sports';
  if (scores.criminal === max) return 'criminal';
  return 'politics';
}

async function fetchNewsByCategory(category) {
  const feeds = RSS_FEEDS[category] || [];
  const allItems = [];

  for (const feed of feeds) {
    try {
      const xml = await fetchUrl(feed.url);
      const items = parseRSS(xml);
      for (const item of items) {
        item.category = detectCategory(item.title, item.content);
        item.source = feed.name;
        if (item.category === category) {
          allItems.push(item);
        }
      }
    } catch (err) {
      console.error(`[NewsFetcher] Error fetching ${feed.name}: ${err.message}`);
    }
  }
  return allItems;
}

async function fetchAllNews() {
  const categories = ['sports', 'politics', 'criminal'];
  const results = {};

  for (const cat of categories) {
    results[cat] = await fetchNewsByCategory(cat);
  }

  return results;
}

module.exports = { fetchNewsByCategory, fetchAllNews, RSS_FEEDS };
