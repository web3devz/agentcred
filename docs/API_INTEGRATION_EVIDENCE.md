# API Integration Evidence

## OpenServ health
{"ok":true,"integration":"openserv","configured":false}

## Status health
{"ok":true,"integration":"status-gasless","configured":false}

## Delegation envelope sample
{"domain":{"name":"AgentCredDelegation","version":"1","chainId":84532},"types":{"Delegation":[{"name":"delegator","type":"address"},{"name":"delegate","type":"address"},{"name":"action","type":"string"},{"name":"resource","type":"string"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"message":{"delegator":"0x1111111111111111111111111111111111111111","delegate":"0x2222222222222222222222222222222222222222","action":"release_milestone","resource":"job:1:milestone:0:release","nonce":1,"deadline":1774078419}}

## Status gasless envelope sample
{"domain":{"name":"AgentCredStatusGasless","version":"1","chainId":11155420},"types":{"GaslessRelease":[{"name":"user","type":"address"},{"name":"jobId","type":"uint256"},{"name":"milestoneId","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"message":{"user":"0x1111111111111111111111111111111111111111","jobId":1,"milestoneId":0,"nonce":9,"deadline":1774078419}}
