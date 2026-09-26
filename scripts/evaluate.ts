import { analyze } from '../lib/providers';
import { demoScenarios, demoQR } from '../lib/demo';
import { inspectPayload } from '../lib/artifacts';
import type { Language } from '../lib/analysis';

async function main() {
  process.loadEnvFile('.env');
  const results = [];
  for (const language of ['en', 'hi', 'te'] as Language[]) {
    for (const scenario of ['normal', 'otp', 'qr'] as const) {
      const started = Date.now();
      const result = await analyze(demoScenarios[scenario].steps[language].join('\n'), language, fetch,
        scenario === 'qr' ? [{id:'synthetic-qr',name:'Synthetic QR',kind:'qr',text:inspectPayload(demoQR).facts.join('\n'),qrPayload:demoQR,confirmed:true,demo:true}] : []);
      const passed = scenario === 'normal' ? result.level === 'low' : result.level === 'high';
      results.push({language,scenario,expected:scenario === 'normal'?'low':'high',level:result.level,source:result.source,connections:result.connections.length,ms:Date.now()-started,passed});
      console.log(JSON.stringify(results.at(-1)));
    }
  }
  const started=Date.now();
  const attachment=await analyze('', 'en', fetch, [{id:'synthetic-message',name:'Synthetic screenshot text',kind:'image',text:'Your account will be blocked immediately. Share your OTP to verify.',confirmed:true}]);
  results.push({language:'en',scenario:'attachment-only',expected:'high',level:attachment.level,source:attachment.source,connections:attachment.connections.length,ms:Date.now()-started,passed:attachment.level==='high'});
  console.log(JSON.stringify(results.at(-1)));
  console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,total:results.length,note:'Small synthetic smoke evaluation; not a real-world accuracy estimate.'}));
  if (results.some(r=>!r.passed)) process.exitCode=1;
}
void main();
