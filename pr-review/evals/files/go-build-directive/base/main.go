package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Order struct {
	SKU      string `json:"sku"`
	Quantity int    `json:"quantity"`
}

func handleOrder(w http.ResponseWriter, r *http.Request) {
	var o Order
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if err := validateOrder(o); err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

func main() {
	http.HandleFunc("/orders", handleOrder)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
