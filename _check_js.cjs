const https = require('https');
https.get('https://stock-monitor-5gx29m3s85cc87fc-1312784056.tcloudbaseapp.com/assets/index-BNnmepNH.js', {timeout: 15000}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Search for the exact zeabur domain
    const patterns = ['zeabur.app', 'tushare', 'localhost:3003', 'api/stocks/search'];
    patterns.forEach(p => {
      const idx = d.indexOf(p);
      console.log(`"${p}" found at index ${idx > -1 ? idx : 'NOT FOUND'}`);
      if (idx > -1) {
        console.log('  context:', JSON.stringify(d.substring(Math.max(0, idx - 30), idx + p.length + 30)));
      }
    });
    
    // Also search for any https:// url that's not a well-known CDN
    const urls = d.match(/https:\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}[^\s"']*/g);
    if (urls) {
      const uniqueUrls = [...new Set(urls)];
      console.log('\nAll HTTPS URLs found:');
      uniqueUrls.slice(0, 20).forEach(u => console.log(' ', u));
    }
  });
}).on('error', e => console.error(e));
