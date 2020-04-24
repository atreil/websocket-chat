package main

import (
	"fmt"
	"math/rand"
	"time"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[string]*Client

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[string]*Client),
	}
}

func (h *Hub) registerClient(c *Client) error {
	if _, ok := h.clients[c.name]; !ok {
		h.clients[c.name] = c
		return nil
	}

	orig := c.name
	rand.Seed(time.Now().Unix())
	var i int
	for i = 0; i < 10; i++ {
		c.name = fmt.Sprintf("%v_%v", orig, rand.Int63())
		if _, ok := h.clients[c.name]; !ok {
			h.clients[c.name] = c
			return nil
		}
	}

	return fmt.Errorf("failed to find unique name '%v' after %v tries", orig, i)
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			if err := h.registerClient(client); err != nil {
				client.send <- []byte(err.Error())
				close(client.send)
			} else {
				client.setInitiliazed()
			}
		case client := <-h.unregister:
			if _, ok := h.clients[client.name]; ok {
				delete(h.clients, client.name)
				close(client.send)
			}
		case message := <-h.broadcast:
			for _, client := range h.clients {
				if !client.initiliazed() {
					continue
				}
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client.name)
				}
			}
		}
	}
}
