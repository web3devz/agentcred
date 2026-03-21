#!/usr/bin/env bash
set -euo pipefail

# Full-stack E2E: web build + verifier + api milestone flow + worker once

npm --workspace @agentcred/web run build >/tmp/web-build.log 2>&1

node apps/verifier-tee/src/server.js >/tmp/verifier.log 2>&1 &
VPID=$!
PORT=3001 VERIFIER_URL=http://localhost:3000/verify node apps/api/src/main.js >/tmp/api.log 2>&1 &
APID=$!
cleanup(){ kill $VPID $APID >/dev/null 2>&1 || true; }
trap cleanup EXIT
sleep 2

curl -s http://localhost:3000/health > /tmp/verifier_health.json
curl -s http://localhost:3001/health > /tmp/api_health.json

JOB=$(curl -s -X POST http://localhost:3001/jobs -H 'content-type: application/json' -d '{"title":"E2E Job","client":"client1","agent":"agent1","amount":5,"milestones":[{"title":"M1","amount":5}]}')
JOB_ID=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.id) process.exit(1); console.log(j.id)" "$JOB")

curl -s -X POST http://localhost:3001/jobs/$JOB_ID/milestones/0/receipt -H 'content-type: application/json' -d '{"artifactUrl":"https://example.com/artifact","summary":"done","logs":["ok"]}' > /tmp/receipt.json
curl -s -X POST http://localhost:3001/jobs/$JOB_ID/milestones/0/score -H 'content-type: application/json' -d '{}' > /tmp/score.json
curl -s -X POST http://localhost:3001/jobs/$JOB_ID/milestones/0/release -H 'content-type: application/json' -d '{}' > /tmp/release.json
curl -s http://localhost:3001/reputation/agent1 > /tmp/reputation.json

npm --workspace @agentcred/worker run once >/tmp/worker-once.log 2>&1

node -e "const fs=require('fs');const receipt=JSON.parse(fs.readFileSync('/tmp/receipt.json','utf8'));const score=JSON.parse(fs.readFileSync('/tmp/score.json','utf8'));const release=JSON.parse(fs.readFileSync('/tmp/release.json','utf8'));const rep=JSON.parse(fs.readFileSync('/tmp/reputation.json','utf8')); if(!receipt.receipt) throw new Error('receipt failed'); if(!score.verifier||score.verifier.verdict!=='pass') throw new Error('score failed'); if(release.payout!=='released') throw new Error('release failed'); if(!(rep.score>0)) throw new Error('reputation failed'); const out={webBuild:'ok',verifierHealth:JSON.parse(fs.readFileSync('/tmp/verifier_health.json','utf8')),apiHealth:JSON.parse(fs.readFileSync('/tmp/api_health.json','utf8')),jobId:score.jobId,receipt,score,release,reputation:rep,workerOnce:'ok'}; fs.writeFileSync('docs/FULL_E2E_RESULT.json',JSON.stringify(out,null,2)); console.log('FULL_E2E_OK');"
