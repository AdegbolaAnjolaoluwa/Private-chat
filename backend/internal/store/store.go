package store

import (
    "sync"

    "github.com/asura409/private-chat-backend/internal/models"
)

// In-memory store. Replace with DB-backed implementation for production.
type Store struct {
    mu sync.RWMutex

    users    map[string]*models.User
    messages map[string][]*models.Message // roomId -> messages
    groups   map[string]*models.Group
}

func New() *Store {
    s := &Store{
        users:    make(map[string]*models.User),
        messages: make(map[string][]*models.Message),
        groups:   make(map[string]*models.Group),
    }
    // preload some demo users
    s.users["1"] = &models.User{ID: "1", Username: "Alice", Email: "alice@example.com", Password: "password"}
    s.users["2"] = &models.User{ID: "2", Username: "Bob", Email: "bob@example.com", Password: "password"}
    return s
}

func (s *Store) AddUser(u *models.User) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.users[u.ID] = u
}

func (s *Store) GetUser(id string) (*models.User, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    u, ok := s.users[id]
    return u, ok
}

func (s *Store) ListUsers() []*models.User {
    s.mu.RLock()
    defer s.mu.RUnlock()
    out := make([]*models.User, 0, len(s.users))
    for _, u := range s.users {
        out = append(out, u)
    }
    return out
}

func (s *Store) AppendMessage(room string, m *models.Message) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.messages[room] = append(s.messages[room], m)
}

func (s *Store) GetMessages(room string) []*models.Message {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.messages[room]
}

func (s *Store) CreateGroup(g *models.Group) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.groups[g.ID] = g
}

func (s *Store) GetGroup(id string) (*models.Group, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    g, ok := s.groups[id]
    return g, ok
}

func (s *Store) ListGroups() []*models.Group {
    s.mu.RLock()
    defer s.mu.RUnlock()
    out := make([]*models.Group, 0, len(s.groups))
    for _, g := range s.groups {
        out = append(out, g)
    }
    return out
}

// Ensure Store implements Repository
var _ Repository = (*Store)(nil)
