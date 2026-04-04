var https = require('https');
var req = https.get('https://stock-monitor.zeabur.app/api/stocks/600519', {timeout: 15000}, function(res) {
  var d = '';
  res.on('data', function(c) { d += c; });
  res.on('end', function() {
    try {
      var j = JSON.parse(d);
      var s = j.data || j;
      console.log('=== Zeabur 线上验证 ===');
      console.log('name:', s.name);
      console.log('price:', s.price);
      console.log('industry:', s.industry);
      console.log('trade_date:', s.trade_date);
      console.log('pe:', s.pe);
      console.log('pb:', s.pb);
      if (s.name && s.name !== '模拟股票' && s.price !== 100) {
        console.log('\n✅ 真实数据! 线上修复成功!');
      } else {
        console.log('\n❌ 还是假数据');
      }
    } catch(e) {
      console.log('raw response:', d.substring(0, 500));
    }
  });
});
req.on('error', function(e) { console.error('err:', e.message); });
req.on('timeout', function() { console.log('timeout'); req.destroy(); });
