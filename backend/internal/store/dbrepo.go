package store

import (
	"errors"
	"log"

	"github.com/asura409/private-chat-backend/internal/models"
	"gorm.io/gorm"
)

// DBRepository implements Repository using a Postgres database via GORM.
// All database operations use parameterized queries (GORM handles this).
type DBRepository struct {
	db *gorm.DB
}

// NewDBRepository creates a new DBRepository with a GORM database connection.
func NewDBRepository(db *gorm.DB) *DBRepository {
	return &DBRepository{db: db}
}

// AddUser inserts a new user (password should already be hashed by the caller).
func (r *DBRepository) AddUser(u *models.User) {
	if err := r.db.Create(u).Error; err != nil {
		log.Printf("error adding user: %v", err)
	}
}

// GetUser retrieves a user by ID.
func (r *DBRepository) GetUser(id string) (*models.User, bool) {
	var user models.User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false
		}
		log.Printf("error getting user: %v", err)
		return nil, false
	}
	return &user, true
}

// ListUsers returns all users (exclude passwords in response).
func (r *DBRepository) ListUsers() []*models.User {
	var users []*models.User
	if err := r.db.Find(&users).Error; err != nil {
		log.Printf("error listing users: %v", err)
		return []*models.User{}
	}
	return users
}

// AppendMessage inserts a new message into a room.
func (r *DBRepository) AppendMessage(room string, m *models.Message) {
	m.Room = room
	if err := r.db.Create(m).Error; err != nil {
		log.Printf("error appending message: %v", err)
	}
}

// GetMessages retrieves all messages for a room (GORM parameterizes the room query).
func (r *DBRepository) GetMessages(room string) []*models.Message {
	var messages []*models.Message
	if err := r.db.Where("room = ?", room).Order("created_at ASC").Find(&messages).Error; err != nil {
		log.Printf("error getting messages: %v", err)
		return []*models.Message{}
	}
	return messages
}

// CreateGroup inserts a new group.
func (r *DBRepository) CreateGroup(g *models.Group) {
	if err := r.db.Create(g).Error; err != nil {
		log.Printf("error creating group: %v", err)
	}
}

// GetGroup retrieves a group by ID.
func (r *DBRepository) GetGroup(id string) (*models.Group, bool) {
	var group models.Group
	if err := r.db.Where("id = ?", id).First(&group).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false
		}
		log.Printf("error getting group: %v", err)
		return nil, false
	}
	return &group, true
}

// ListGroups returns all groups.
func (r *DBRepository) ListGroups() []*models.Group {
	var groups []*models.Group
	if err := r.db.Find(&groups).Error; err != nil {
		log.Printf("error listing groups: %v", err)
		return []*models.Group{}
	}
	return groups
}

// Ensure DBRepository implements Repository
var _ Repository = (*DBRepository)(nil)
