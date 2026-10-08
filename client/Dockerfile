# The storefront image.
#
# Two stages: one that compiles the Vite application, and one that serves the
# files it produced. The build stage needs Node and the whole dependency tree;
# the runtime stage needs neither, and shipping nginx rather than a Node process
# means the static half of the deployment costs one small process instead of one
# more application server.
#
# The context is the repository root, for the same reason as the API image: the
# lockfile and the workspace file that describe the dependency tree are there.

FROM node:24-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN npm install --global pnpm@10.34.5

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/
COPY client/package.json client/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter client

COPY tsconfig.base.json ./
COPY client ./client

# Where the browser reaches the API. The default is the path this container
# serves and proxies itself, which is what makes the image work unchanged
# behind a reverse proxy; a deployment that keeps the API on its own hostname
# passes its address here instead. Vite reads the value at build time, so it is
# an argument rather than a runtime environment variable.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter client run build

FROM nginx:1.29-alpine AS runtime

# The server block replaces nginx's default one rather than adding to it.
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
