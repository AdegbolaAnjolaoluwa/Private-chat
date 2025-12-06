package models

import "time"

type User struct {
	ID        string `gorm:"primaryKey" json:"id"`
	Username  string `gorm:"uniqueIndex" json:"username"`
	Email     string `gorm:"uniqueIndex" json:"email"`
	Password  string `json:"-"` // never expose in JSON
	CreatedAt time.Time
}

type Message struct {
	ID        string     `gorm:"primaryKey" json:"id"`
	Room      string     `gorm:"index" json:"room,omitempty"` // indexed for room queries
	SenderID  string     `json:"sender"`
	Body      string     `json:"body"`
	CreatedAt time.Time  `json:"createdAt"`
	ReadBy    []string   `gorm:"type:text[]" json:"readBy"`
	Reactions []Reaction `gorm:"foreignKey:MessageID" json:"reactions"`
}

type Reaction struct {
	ID        string `gorm:"primaryKey"`
	MessageID string `gorm:"index"`
	UserID    string `json:"userId"`
	Emoji     string `json:"emoji"`
}

type Group struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Name      string    `json:"name"`
	Members   []string  `gorm:"type:text[]" json:"members"`
	CreatedAt time.Time
}
