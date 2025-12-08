package handlers

import (
    "github.com/gofiber/fiber/v2"
    "github.com/google/uuid"

    "github.com/asura409/private-chat-backend/internal/models"
    "github.com/asura409/private-chat-backend/internal/store"
    "github.com/asura409/private-chat-backend/internal/utils"
)

type AuthHandler struct{
    repo store.Repository
}

func NewAuthHandler(repo store.Repository) *AuthHandler { return &AuthHandler{repo: repo} }

type signupReq struct{
    Email string `json:"email"`
    Username string `json:"username"`
    Password string `json:"password"`
}

func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req signupReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	// Validate inputs
	if req.Email == "" || req.Username == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing required fields"})
	}
	if len(req.Password) < 8 {
		return c.Status(400).JSON(fiber.Map{"error": "password must be at least 8 characters"})
	}
	// Hash password securely before storing
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to hash password"})
	}
	id := uuid.New().String()
	u := &models.User{ID: id, Email: req.Email, Username: req.Username, Password: hashedPassword}
	h.repo.AddUser(u)
	token, _ := utils.NewToken(id)
	// Return user without password
	return c.Status(201).JSON(fiber.Map{"token": token, "user": fiber.Map{"id": u.ID, "email": u.Email, "username": u.Username}})
}

type loginReq struct{
    Identifier string `json:"identifier"`
    Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req loginReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	if req.Identifier == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing credentials"})
	}
	for _, u := range h.repo.ListUsers() {
		if u.Email == req.Identifier || u.Username == req.Identifier {
			// Use bcrypt comparison (secure, timing-attack resistant)
			if utils.CheckPassword(u.Password, req.Password) {
				token, _ := utils.NewToken(u.ID)
				// Return user without password
				return c.JSON(fiber.Map{"token": token, "user": fiber.Map{"id": u.ID, "email": u.Email, "username": u.Username}})
			}
		}
	}
	return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
}
