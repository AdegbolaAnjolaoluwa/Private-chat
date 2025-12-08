package utils

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = getJWTSecret()

// getJWTSecret reads JWT_SECRET from environment or uses a demo default
func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "replace-this-secret-with-env-var"
	}
	return []byte(secret)
}

// HashPassword hashes a plaintext password using bcrypt (cost 12).
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(hash), err
}

// CheckPassword compares a plaintext password against a bcrypt hash.
func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// NewToken creates a JWT token with expiry set to 24 hours.
func NewToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(jwtSecret)
}

// ParseToken validates and extracts the userID from a JWT token.
func ParseToken(tokenStr string) (string, error) {
	t, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) { return jwtSecret, nil })
	if err != nil {
		return "", err
	}
	if !t.Valid {
		return "", errors.New("invalid token")
	}
	claims := t.Claims.(jwt.MapClaims)
	sub, _ := claims["sub"].(string)
	return sub, nil
}

// RefreshToken generates a new token if the current one is close to expiry (within 1 hour).
func RefreshToken(tokenStr string) (string, error) {
	t, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) { return jwtSecret, nil })
	if err != nil {
		return "", err
	}
	claims := t.Claims.(jwt.MapClaims)
	exp, _ := claims["exp"].(float64)
	if time.Now().Unix() > int64(exp)-3600 { // within 1 hour of expiry
		return NewToken(claims["sub"].(string))
	}
	return tokenStr, nil
}

// GenerateRefreshToken creates a long-lived refresh token (random bytes, not JWT).
func GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(b), nil
}
