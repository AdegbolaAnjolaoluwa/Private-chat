package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/asura409/private-chat-backend/internal/handlers"
	"github.com/asura409/private-chat-backend/internal/models"
	"github.com/asura409/private-chat-backend/internal/store"
	"github.com/asura409/private-chat-backend/internal/utils"
	hubpkg "github.com/asura409/private-chat-backend/internal/ws"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	// Initialize database connection
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL environment variable not set")
	}

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Auto-migrate models (creates tables if they don't exist)
	if err := db.AutoMigrate(&models.User{}, &models.Message{}, &models.Group{}, &models.Reaction{}); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	log.Println("Database connected and migrated successfully")

	app := fiber.New()
	// Allow frontend origin (set FRONTEND_ORIGIN in .env), default to Vite dev origin
	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:5173"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins:     frontendOrigin,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Content-Type,Authorization",
		AllowCredentials: true,
	}))

	// Initialize repository and services
	repo := store.NewDBRepository(db)
	hub := hubpkg.NewHub()

	// WebSocket auth middleware: validate token during the HTTP handshake
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			token := c.Query("token", "")
			if token == "" {
				return c.Status(401).SendString("missing token")
			}
			userID, err := utils.ParseToken(token)
			if err != nil || userID == "" {
				return c.Status(401).SendString("invalid token")
			}
			c.Locals("userID", userID)
			return c.Next()
		}
		return c.Status(426).SendString("upgrade required")
	})

	// REST API
	api := app.Group("/api")
	api.Post("/auth/signup", handlers.NewAuthHandler(repo).Signup)
	api.Post("/auth/login", handlers.NewAuthHandler(repo).Login)
	api.Get("/friends", handlers.NewUserHandler(repo).ListFriends)

	// chats
	api.Get("/chats/:friendId/messages", handlers.NewChatHandler(repo, hub).ListMessages)
	api.Post("/chats/:friendId/messages", handlers.NewChatHandler(repo, hub).SendMessage)

	// groups
	api.Post("/groups", handlers.NewChatHandler(repo, hub).CreateGroup)
	api.Get("/groups/:groupId/messages", handlers.NewChatHandler(repo, hub).ListGroupMessages)
	api.Post("/groups/:groupId/messages", handlers.NewChatHandler(repo, hub).SendGroupMessage)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// WebSocket endpoint (authenticated)
	app.Get("/ws", websocket.New(handlers.NewWSHandler(repo, hub).HandleConn))

	log.Printf("Listening on :%s\n", port)
	log.Fatal(app.Listen(":" + port))
}
