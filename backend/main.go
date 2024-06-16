package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

type CallMessage struct {
	UserToCall string `json:"userToCall"`
	Signal     string `json:"signal"`
	From       string `json:"from"`
}

type AcceptMessage struct {
	Signal string `json:"signal"`
	To     string `json:"to"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan Message)

func main() {
	http.HandleFunc("/ws", handleConnections)

	go handleMessages()

	fmt.Println("server started on port :8000")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		fmt.Println("error starting server: ", err)
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("error upgrading connection: ", err)
	}
	defer ws.Close()

	clients[ws] = true

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			fmt.Println("error handling message: ", err)
			delete(clients, ws)
			break
		}

		switch msg.Type {
		case "callUser":
			handleCallUser(ws, msg)
		case "acceptCall":
			handleAcceptCall(ws, msg)
		}

		broadcast <- msg
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				fmt.Println("error writing message: ", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func handleCallUser(ws *websocket.Conn, msg Message) {
	var callMsg CallMessage
	if err := json.Unmarshal([]byte(msg.Data), &callMsg); err != nil {
		fmt.Println("error unmarshalling call message: ", err)
		return
	}

	for client := range clients {
		if client != ws {
			client.WriteJSON(Message{Type: "callUser", Data: string(msg.Data)})
		}
	}
}

func handleAcceptCall(ws *websocket.Conn, msg Message) {
	var acceptMessage AcceptMessage
	if err := json.Unmarshal([]byte(msg.Data), &acceptMessage); err != nil {
		fmt.Println("error unmarshaling accept message: ", err)
		return
	}

	for client := range clients {
		if client != ws {
			client.WriteJSON(Message{Type: "acceptCall", Data: string(msg.Data)})
		}
	}
}
