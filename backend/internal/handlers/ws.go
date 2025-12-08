package handlers

import (
    "encoding/json"
    "log"
    "time"

    websocket "github.com/gofiber/websocket/v2"
    "github.com/google/uuid"

    "github.com/asura409/private-chat-backend/internal/models"
    st "github.com/asura409/private-chat-backend/internal/store"
    hubpkg "github.com/asura409/private-chat-backend/internal/ws"
)

// WSHandler uses Fiber's websocket and exposes HandleConn. It requires the store and hub.
type WSHandler struct{
    s st.Repository
    hub *hubpkg.Hub
}
func NewWSHandler(s st.Repository, hub *hubpkg.Hub) *WSHandler {
    return &WSHandler{s: s, hub: hub}
}

type wsMsg struct{
    Type string `json:"type"`
    Room string `json:"room"`
    Payload json.RawMessage `json:"payload"`
}

// HandleConn is the websocket connection handler used with websocket.New()
func (h *WSHandler) HandleConn(conn *websocket.Conn) {
    defer func() {
        h.hub.RemoveConn(conn)
        _ = conn.Close()
    }()

    // For handshake-time auth we expect middleware to set a local userID; read it from conn.Locals
    loc := conn.Locals("userID")
    userID, _ := loc.(string)
    if userID == "" {
        _ = conn.WriteJSON(map[string]interface{}{"error": "unauthorized"})
        return
    }
    // register connection (creates client and writer goroutine)
    h.hub.AddConn(userID, conn)

    // read loop
    for {
        _, data, err := conn.ReadMessage()
        if err != nil {
            log.Println("ws read err:", err)
            return
        }
        var m wsMsg
        if err := json.Unmarshal(data, &m); err != nil {
            log.Println("invalid ws message", err)
            continue
        }
        switch m.Type {
        case "join":
            // client requests join of a room
            var payload map[string]string
            _ = json.Unmarshal(m.Payload, &payload)
            room := m.Room
            if room == "" {
                room = payload["room"]
            }
            if room != "" {
                h.hub.JoinRoom(conn, room)
            }
        case "leave":
            var payload map[string]string
            _ = json.Unmarshal(m.Payload, &payload)
            room := m.Room
            if room == "" {
                room = payload["room"]
            }
            if room != "" {
                h.hub.LeaveRoom(conn, room)
            }
        case "message:new":
            var payload map[string]interface{}
            _ = json.Unmarshal(m.Payload, &payload)
            room := m.Room
            if room == "" {
                room, _ = payload["room"].(string)
            }
            body, _ := payload["body"].(string)
            sender, _ := payload["sender"].(string)
            if room != "" && body != "" {
                msg := &models.Message{
                    ID: uuid.New().String(),
                    SenderID: sender,
                    Body: body,
                    CreatedAt: time.Now(),
                }
                h.s.AppendMessage(room, msg)
                // broadcast to all room members
                h.hub.Broadcast(room, map[string]interface{}{"type":"message:new","room":room,"message":msg})
            }
        default:
            // echo unknown types
            _ = conn.WriteMessage(websocket.TextMessage, data)
        }
    }
}
