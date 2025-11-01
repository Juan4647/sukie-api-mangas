const express = require('express');
const { chromium } = require('playwright');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
// AJUSTE 1: Usar a porta do ambiente ou 3000 como padrão para desenvolvimento local
const PORT = process.env.PORT || 3000;
app.use(cors());

const BASE_URL = 'https://mangaonline.app';

let browser;

// Opções de lançamento para o ambiente de produção (Render)
const playwrightLaunchOptions = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Opcional, mas recomendado para ambientes com memória limitada
    ],
};

async function startServer() {
    // AJUSTE 2: Usar as opções de lançamento
    browser = await chromium.launch(process.env.NODE_ENV === 'production' ? playwrightLaunchOptions : {});
    console.log('Navegador headless iniciado.');

    app.listen(PORT, () => {
        // Usa a porta dinâmica na mensagem de log
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

// O restante do seu código (endpoints /popular, /search, /series, etc.) permanece exatamente o mesmo...

// --- ENDPOINTS DA API ---

// NOVO ENDPOINT: para buscar os mangás populares da página inicial
app.get('/popular', async (req, res) => {
    try {
        const { data } = await axios.get(BASE_URL);
        const $ = cheerio.load(data);
        const mangas = [];
        
        $('.page-item-detail.manga').each((i, el) => {
            const title = $(el).find('.post-title a').text().trim();
            const url = $(el).find('.post-title a').attr('href');
            const image = $(el).find('.item-thumb img').attr('src');
            
            if (title && url && image) {
                mangas.push({ title, url, image });
            }
        });

        res.json(mangas.slice(0, 18));
    } catch (error) {
        console.error('Erro ao buscar mangás populares:', error.message);
        res.status(500).send({ error: 'Falha ao buscar os mangás populares.' });
    }
});


// Endpoint de busca
app.get('/search', async (req, res) => {
    const { word } = req.query;
    if (!word) return res.status(400).send({ error: 'A palavra de busca é obrigatória' });
    try {
        const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(word)}&post_type=wp-manga`;
        const { data } = await axios.get(searchUrl);
        const $ = cheerio.load(data);
        const mangas = [];
        $('.c-tabs-item__content').each((i, el) => {
            const title = $(el).find('.post-title h3 a').text().trim();
            const url = $(el).find('.post-title h3 a').attr('href');
            const image = $(el).find('.tab-thumb a img').attr('src');
            if (title && url && image) mangas.push({ title, url, image });
        });
        res.json(mangas);
    } catch (error) {
        console.error('Erro na busca:', error.message);
        res.status(500).send({ error: 'Falha ao buscar os mangás.' });
    }
});

// Função auxiliar
const getSummaryDetail = ($, label) => {
    return $(`.post-content_item:has(h5:contains("${label}")) .summary-content`).text().trim();
};

// Endpoint de detalhes
app.get('/series', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send({ error: 'A URL do mangá é obrigatória' });

    let page = null;
    try {
        const context = await browser.newContext();
        page = await context.newPage();
        
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.wp-manga-chapter a', { timeout: 15000 });

        const htmlContent = await page.content();
        const $ = cheerio.load(htmlContent);

        const title = $('.post-title h1').text().trim();
        const image = $('.summary_image a img').attr('src');
        const synopsis = $('.summary__content .description-summary p').text().trim();
        const alternative = getSummaryDetail($, 'Alternative');
        const type = getSummaryDetail($, 'Type');
        const status = getSummaryDetail($, 'Status');
        
        const chapters = [];
        $('.wp-manga-chapter').each((i, el) => {
            const chapterTitle = $(el).find('a').text().trim();
            const chapterUrl = $(el).find('a').attr('href');
            if (chapterTitle && chapterUrl) chapters.push({ title: chapterTitle, url: chapterUrl });
        });
        
        res.json({ title, image, synopsis, chapters, alternative, type, status });

    } catch (error) {
        console.error('Erro ao obter detalhes da série:', error.message);
        res.status(500).send({ error: 'Falha ao obter os detalhes do mangá.' });
    } finally {
        if (page) await page.close();
    }
});

// Endpoint de capítulo
app.get('/chapter', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send({ error: 'A URL do capítulo é obrigatória' });
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const pages = [];
        $('.reading-content .page-break img').each((i, el) => {
            const imageUrl = $(el).attr('src').trim();
            if (imageUrl) pages.push({ imageUrl, pageNumber: i + 1 });
        });
        res.json({ pages });
    } catch (error) {
        console.error('Erro ao obter páginas do capítulo:', error.message);
        res.status(500).send({ error: 'Falha ao obter as páginas do capítulo.' });
    }
});


startServer();