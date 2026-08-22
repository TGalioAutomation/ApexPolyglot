FROM node:22-alpine

WORKDIR /app
COPY --chown=node:node . .

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4174 \
    PREGEN_DISABLED=1

USER node
EXPOSE 4174

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4174/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
