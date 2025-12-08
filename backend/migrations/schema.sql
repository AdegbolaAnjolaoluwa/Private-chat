-- PostgreSQL schema for Private Chat Backend
-- Drop tables if they exist (for dev/testing only)
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (supports both 1:1 and group chats)
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    room VARCHAR(255) NOT NULL, -- format: "1:2" for 1:1, "group:gid" for groups
    sender_id VARCHAR(36) NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    read_by TEXT[] DEFAULT '{}', -- array of user IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (room), -- optimize queries by room
    INDEX (created_at)
);

-- Reactions table
CREATE TABLE reactions (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Groups table
CREATE TABLE groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    members TEXT[] NOT NULL, -- array of user IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX idx_messages_room ON messages(room);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_reactions_message_id ON reactions(message_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
