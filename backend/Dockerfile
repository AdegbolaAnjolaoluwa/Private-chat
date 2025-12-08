# Multi-stage Dockerfile for Private-chat backend
# Builder stage: produce a static Go binary
FROM golang:1.21-alpine AS builder

# Install git (for go modules) and ca-certificates for SSL
RUN apk add --no-cache git build-base

WORKDIR /src

# Cache modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the backend source
COPY . .

# Build static binary
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -trimpath -ldflags "-s -w" -o /app/private-chat ./src

# Final image: small and secure
FROM alpine:3.18
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy binary from builder
COPY --from=builder /app/private-chat /usr/local/bin/private-chat

# Set permissions
RUN chown app:app /usr/local/bin/private-chat && chmod 755 /usr/local/bin/private-chat

USER app
WORKDIR /home/app

EXPOSE 4000

# Environment defaults (override at runtime)
ENV PORT=4000

ENTRYPOINT ["/usr/local/bin/private-chat"]
