package ws

import (
    "log"
    "sync"

    websocket "github.com/gofiber/websocket/v2"
)

// Client wraps a websocket.Conn with a send channel and metadata
type Client struct {
    Conn *websocket.Conn
    Send chan interface{}
    UserID string
}

// Hub manages active websocket clients and room membership.
type Hub struct {
    mu sync.RWMutex

    // room -> set of clients
    rooms map[string]map[*Client]struct{}
    // conn -> client
    connClients map[*websocket.Conn]*Client
}

func NewHub() *Hub {
    return &Hub{rooms: make(map[string]map[*Client]struct{}), connClients: make(map[*websocket.Conn]*Client)}
}

// AddConn registers a connection, creates a Client and starts its write loop
func (h *Hub) AddConn(userID string, conn *websocket.Conn) *Client {
    h.mu.Lock()
    defer h.mu.Unlock()
    if existing, ok := h.connClients[conn]; ok {
        return existing
    }
    c := &Client{Conn: conn, Send: make(chan interface{}, 32), UserID: userID}
    h.connClients[conn] = c
    go h.clientWriter(c)
    return c
}

func (h *Hub) clientWriter(c *Client) {
    for msg := range c.Send {
        if err := c.Conn.WriteJSON(msg); err != nil {
            log.Println("client write error:", err)
            // on write error, close connection and cleanup
            _ = c.Conn.Close()
            h.RemoveConn(c.Conn)
            return
        }
    }
}

func (h *Hub) RemoveConn(conn *websocket.Conn) {
    h.mu.Lock()
    defer h.mu.Unlock()
    client, ok := h.connClients[conn]
    if !ok { return }
    // remove from rooms
    for room, clients := range h.rooms {
        if _, present := clients[client]; present {
            delete(clients, client)
            if len(clients) == 0 {
                delete(h.rooms, room)
            }
        }
    }
    delete(h.connClients, conn)
    // close send channel to stop writer
    close(client.Send)
}

func (h *Hub) JoinRoom(conn *websocket.Conn, room string) {
    h.mu.Lock()
    defer h.mu.Unlock()
    client, ok := h.connClients[conn]
    if !ok { return }
    if _, ok := h.rooms[room]; !ok {
        h.rooms[room] = make(map[*Client]struct{})
    }
    h.rooms[room][client] = struct{}{}
}

func (h *Hub) LeaveRoom(conn *websocket.Conn, room string) {
    h.mu.Lock()
    defer h.mu.Unlock()
    client, ok := h.connClients[conn]
    if !ok { return }
    if clients, ok := h.rooms[room]; ok {
        delete(clients, client)
        if len(clients) == 0 {
            delete(h.rooms, room)
        }
    }
}

// Broadcast sends v to all clients in the room using non-blocking sends
func (h *Hub) Broadcast(room string, v interface{}) {
    h.mu.RLock()
    clients := h.rooms[room]
    h.mu.RUnlock()
    if clients == nil { return }
    for c := range clients {
        select {
        case c.Send <- v:
            // queued
        default:
            // drop the message for this client to avoid blocking
        }
    }
}

func (h *Hub) UserID(conn *websocket.Conn) string {
    h.mu.RLock()
    defer h.mu.RUnlock()
    if c, ok := h.connClients[conn]; ok {
        return c.UserID
    }
    return ""
}
