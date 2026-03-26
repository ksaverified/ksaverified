module.exports = function handler(req, res) {
    const robots = `User-agent: *
Allow: /
Sitemap: https://ksaverified.com/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(robots);
};
