package store

import "github.com/asura409/private-chat-backend/internal/models"

// Repository defines the operations the handlers need from a data store.
// This allows swapping the implementation (in-memory, SQL, etc.) without changing handlers.
type Repository interface {
    // Users
    AddUser(u *models.User)
    GetUser(id string) (*models.User, bool)
    ListUsers() []*models.User

    // Messages (room-based)
    AppendMessage(room string, m *models.Message)
    GetMessages(room string) []*models.Message

    // Groups
    CreateGroup(g *models.Group)
    GetGroup(id string) (*models.Group, bool)
    ListGroups() []*models.Group
}
