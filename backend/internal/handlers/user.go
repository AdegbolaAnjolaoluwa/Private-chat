package handlers

import (
    "github.com/gofiber/fiber/v2"

    "github.com/asura409/private-chat-backend/internal/store"
)

type UserHandler struct{
    repo store.Repository
}

func NewUserHandler(repo store.Repository) *UserHandler { return &UserHandler{repo: repo} }

// ListFriends returns all users except the requesting user (query param userId)
func (h *UserHandler) ListFriends(c *fiber.Ctx) error {
    userId := c.Query("userId", "1")
    users := h.repo.ListUsers()
    out := make([]map[string]interface{}, 0, len(users))
    for _, u := range users {
        if u.ID == userId { continue }
        status := "offline"
        out = append(out, map[string]interface{}{"id": u.ID, "username": u.Username, "email": u.Email, "status": status})
    }
    return c.JSON(out)
}
