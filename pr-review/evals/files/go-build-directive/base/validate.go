package main

import "errors"

func validateOrder(o Order) error {
	if o.SKU == "" {
		return errors.New("sku is required")
	}
	if o.Quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	return nil
}
