package handlers

import (
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/google/uuid"

    "github.com/asura409/private-chat-backend/internal/models"
    "github.com/asura409/private-chat-backend/internal/store"
    "github.com/asura409/private-chat-backend/internal/ws"
)

type ChatHandler struct{
    repo store.Repository
    hub *ws.Hub
}

func NewChatHandler(repo store.Repository, hub *ws.Hub) *ChatHandler { return &ChatHandler{repo: repo, hub: hub} }

func roomKey(a, b string) string {
    if a < b { return a + ":" + b }
    return b + ":" + a
}

func (h *ChatHandler) ListMessages(c *fiber.Ctx) error {
    friendId := c.Params("friendId")
    userId := c.Query("userId", "1")
    key := roomKey(userId, friendId)
    msgs := h.repo.GetMessages(key)
    return c.JSON(msgs)
}

type sendReq struct{
    Sender string `json:"sender"`
    Body   string `json:"body"`
}

func (h *ChatHandler) SendMessage(c *fiber.Ctx) error {
    friendId := c.Params("friendId")
    var req sendReq
    if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error": "invalid"}) }
    if req.Sender == "" || req.Body == "" { return c.Status(400).JSON(fiber.Map{"error": "missing"}) }
    key := roomKey(req.Sender, friendId)
    m := &models.Message{ID: uuid.New().String(), SenderID: req.Sender, Body: req.Body, CreatedAt: time.Now()}
    h.repo.AppendMessage(key, m)
    // broadcast to connected clients in the room
    h.hub.Broadcast(key, map[string]interface{}{"type":"message:new","room":key,"message":m})
    return c.Status(201).JSON(m)
}

type createGroupReq struct{
    Name string `json:"name"`
    Members []string `json:"members"`
}

func (h *ChatHandler) CreateGroup(c *fiber.Ctx) error {
    var req createGroupReq
    if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error": "invalid"}) }
    id := uuid.New().String()
    g := &models.Group{ID: id, Name: req.Name, Members: req.Members}
    h.repo.CreateGroup(g)
    return c.Status(201).JSON(g)
}

func (h *ChatHandler) ListGroupMessages(c *fiber.Ctx) error {
    gid := c.Params("groupId")
    msgs := h.repo.GetMessages("group:" + gid)
    return c.JSON(msgs)
}

func (h *ChatHandler) SendGroupMessage(c *fiber.Ctx) error {
    gid := c.Params("groupId")
    var req sendReq
    if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error": "invalid"}) }
    if req.Sender == "" || req.Body == "" { return c.Status(400).JSON(fiber.Map{"error": "missing"}) }
    key := "group:" + gid
    m := &models.Message{ID: uuid.New().String(), SenderID: req.Sender, Body: req.Body, CreatedAt: time.Now()}
    h.repo.AppendMessage(key, m)
    h.hub.Broadcast(key, map[string]interface{}{"type":"message:new","room":key,"message":m})
    return c.Status(201).JSON(m)
}
