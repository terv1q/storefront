# The API image.
#
# Four stages, because the three things that go into a production image need
# different things to be installed: the dependencies to build with, the compiled
# output, and a node_modules that holds only what the server reads at runtime.
# Building all of that in one stage would leave the compiler, the test runner,
# and the Prisma CLI in the image that is shipped.
#
# The build context is the repository root rather than `server/`, because this
# is a pnpm workspace: the lockfile, the workspace file, and the shared
# `tsconfig.base.json` all live one level up, and an install run from inside
# `server/` would resolve a different dependency tree.
#
# `pnpm` is installed rather than enabled through corepack, because the version
# is pinned in `package.json` and the same number is repeated here on purpose:
# an image that installs a different package manager than the one that wrote the
# lockfile is an image built from a different dependency tree.

FROM node:24-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN npm install --global pnpm@10.34.5

WORKDIR /app

# Dependencies, resolved from the lockfile alone. The manifests are copied
# before the source so that this layer is reused until a dependency changes —
# editing a service does not re-install the tree. Lifecycle scripts are skipped
# here and run deliberately later, because Prisma's generator needs the schema,
# which is not copied into this stage.
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/
COPY client/package.json client/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# The compiled server. `prisma generate` runs before `tsc`, because the
# generated client is what the services import and the type check reads it.
FROM deps AS builder

COPY tsconfig.base.json ./
COPY server ./server

RUN pnpm --filter server exec prisma generate \
 && pnpm --filter server run build

# The production dependencies, installed on their own so the image does not
# carry the compiler, the test runner, or the seed's TypeScript loader. The
# client's packages are excluded by the filter: this image serves no markup.
FROM deps AS prod-deps

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --prod --filter server

# What is shipped. Nothing from this stage is a build tool, and nothing in it is
# owned by root: the process runs as the `node` user that the base image already
# defines, so a defect that reaches the filesystem cannot write beside the code.
FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/server/package.json ./server/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/prisma.config.ts ./server/prisma.config.ts
COPY --from=builder /app/server/tsconfig.json ./server/tsconfig.json

# The generated Prisma client is written into the installed dependency's own
# directory by `prisma generate`, so it has to be carried over from the stage
# that ran it: the production install above wrote the package without its
# generated half.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Review photographs are written under this directory, which a deployment mounts
# as a volume so that a restart does not take the pictures with it.
RUN mkdir -p /app/server/uploads && chown -R node:node /app

USER node

WORKDIR /app/server

EXPOSE 4000

# The endpoint the process serves is the check: a container that answers 503
# while its database is unreachable is a container a platform should stop
# sending traffic to.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "dist/server.js"]
