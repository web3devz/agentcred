FROM node:22-alpine

LABEL org.opencontainers.image.title="AgentCred" \
      org.opencontainers.image.description="Verifiable Agent Reputation + Escrow Hiring Network with TLS 1.3/mTLS secure runtime, ERC-8004 receipts, and supply-chain provenance." \
      org.opencontainers.image.source="https://github.com/web3devz/agentcred" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copy full repo first so npm workspaces dependencies (e.g. apps/api) are available during install
COPY . .
RUN npm ci

EXPOSE 8443
ENV NODE_ENV=production
CMD ["node", "apps/api/src/main.js"]
