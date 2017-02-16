// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

package oauthkeycloak

import (
	"encoding/json"
	"github.com/mattermost/platform/einterfaces"
	"github.com/mattermost/platform/model"
	"io"
	"strings"

	l4g "github.com/alecthomas/log4go"
)

type KeycloakProvider struct {
}

type KeycloakUser struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
}

func init() {
	provider := &KeycloakProvider{}
	einterfaces.RegisterOauthProvider(model.USER_AUTH_SERVICE_KEYCLOAK, provider)
}

func userFromKeycloakUser(ku *KeycloakUser) *model.User {
	user := &model.User{}
	username := strings.Split(ku.Email, "@")[0]
	user.Username = model.CleanUsername(username)
	splitName := strings.Split(ku.Name, " ")
	if len(splitName) == 2 {
		user.FirstName = splitName[0]
		user.LastName = splitName[1]
	} else if len(splitName) >= 2 {
		user.FirstName = splitName[0]
		user.LastName = strings.Join(splitName[1:], " ")
	} else {
		user.FirstName = ku.Name
	}
	user.Email = ku.Email
	user.AuthData = &ku.Email 
	user.AuthService = model.USER_AUTH_SERVICE_KEYCLOAK

	return user
}

func keycloakUserFromJson(data io.Reader) *KeycloakUser {
	decoder := json.NewDecoder(data)
	l4g.Debug(decoder)

	var ku KeycloakUser
	err := decoder.Decode(&ku)
	l4g.Debug("In keycloakUserFromJson")
	l4g.Debug(&ku)
	if err == nil {
		return &ku
	} else {
		return nil
	}
}

func (ku *KeycloakUser) IsValid() bool {
	if len(ku.Email) == 0 {
		return false
	}

	return true
}

func (ku *KeycloakUser) getAuthData() string {
	return ku.Email 
}

func (m *KeycloakProvider) GetIdentifier() string {
	return model.USER_AUTH_SERVICE_KEYCLOAK
}

func (m *KeycloakProvider) GetUserFromJson(data io.Reader) *model.User {
	ku := keycloakUserFromJson(data)
	if ku.IsValid() {
		return userFromKeycloakUser(ku)
	}

	return &model.User{}
}

func (m *KeycloakProvider) GetAuthDataFromJson(data io.Reader) string {
	ku := keycloakUserFromJson(data)
	l4g.Debug("Printing ku...")
	l4g.Debug(ku)

	if ku.IsValid() {
		return ku.getAuthData()
	}

	return ""
}
