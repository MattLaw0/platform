// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';

import * as Utils from 'utils/utils.jsx';

import AdminSettings from './admin_settings.jsx';
import BooleanSetting from './boolean_setting.jsx';
import {FormattedHTMLMessage, FormattedMessage} from 'react-intl';
import SettingsGroup from './settings_group.jsx';
import TextSetting from './text_setting.jsx';

export default class KeycloakSettings extends AdminSettings {
    constructor(props) {
        super(props);

        this.getConfigFromState = this.getConfigFromState.bind(this);

        this.renderSettings = this.renderSettings.bind(this);
    }

    getConfigFromState(config) {
        config.KeycloakSettings.Enable = this.state.enable;
        config.KeycloakSettings.Id = this.state.id;
        config.KeycloakSettings.Secret = this.state.secret;
        config.KeycloakSettings.UserApiEndpoint = this.state.userApiEndpoint;
        config.KeycloakSettings.AuthEndpoint = this.state.authEndpoint;
        config.KeycloakSettings.TokenEndpoint = this.state.tokenEndpoint;

        return config;
    }

    getStateFromConfig(config) {
        return {
            enable: config.KeycloakSettings.Enable,
            id: config.KeycloakSettings.Id,
            secret: config.KeycloakSettings.Secret,
            userApiEndpoint: config.KeycloakSettings.UserApiEndpoint,
            authEndpoint: config.KeycloakSettings.AuthEndpoint,
            tokenEndpoint: config.KeycloakSettings.TokenEndpoint
        };
    }

    renderTitle() {
        return (
            <h3>
                <FormattedMessage
                    id='admin.authentication.keycloak'
                    defaultMessage='Keycloak'
                />
            </h3>
        );
    }

    renderSettings() {
        return (
            <SettingsGroup>
                <BooleanSetting
                    id='enable'
                    label={
                        <FormattedMessage
                            id='admin.keycloak.enableTitle'
                            defaultMessage='Enable authentication with Keycloak: '
                        />
                    }
                    helpText={
                        <div>
                            <FormattedMessage
                                id='admin.keycloak.enableDescription'
                                defaultMessage='When true, Mattermost allows team creation and account signup using Keycloak OAuth.'
                            />
                            <br/>
                            <FormattedHTMLMessage
                                id='admin.keycloak.EnableHtmlDesc'
                                defaultMessage='<ol><li>Log in to your Keycloak account and go to Profile Settings -> Applications.</li><li>Enter Redirect URIs "<your-mattermost-url>/login/keycloak/complete" (example: http://localhost:8065/login/keycloak/complete) and "<your-mattermost-url>/signup/keycloak/complete". </li><li>Then use "Application Secret Key" and "Application ID" fields from Keycloak to complete the options below.</li><li>Complete the Endpoint URLs below. </li></ol>'
                            />
                        </div>
                    }
                    value={this.state.enable}
                    onChange={this.handleChange}
                />
                <TextSetting
                    id='id'
                    label={
                        <FormattedMessage
                            id='admin.keycloak.clientIdTitle'
                            defaultMessage='Application ID:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.keycloak.clientIdExample', 'Ex "jcuS8PuvcpGhpgHhlcpT1Mx42pnqMxQY"')}
                    helpText={
                        <FormattedMessage
                            id='admin.keycloak.clientIdDescription'
                            defaultMessage='Obtain this value via the instructions above for logging into Keycloak'
                        />
                    }
                    value={this.state.id}
                    onChange={this.handleChange}
                    disabled={!this.state.enable}
                />
                <TextSetting
                    id='secret'
                    label={
                        <FormattedMessage
                            id='admin.keycloak.clientSecretTitle'
                            defaultMessage='Application Secret Key:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.keycloak.clientSecretExample', 'Ex "jcuS8PuvcpGhpgHhlcpT1Mx42pnqMxQY"')}
                    helpText={
                        <FormattedMessage
                            id='admin.gitab.clientSecretDescription'
                            defaultMessage='Obtain this value via the instructions above for logging into Keycloak.'
                        />
                    }
                    value={this.state.secret}
                    onChange={this.handleChange}
                    disabled={!this.state.enable}
                />
                <TextSetting
                    id='userApiEndpoint'
                    label={
                        <FormattedMessage
                            id='admin.keycloak.userTitle'
                            defaultMessage='User API Endpoint:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.keycloak.userExample', 'Ex "https://<your-keycloak-url>/api/v3/user"')}
                    helpText={
                        <FormattedMessage
                            id='admin.keycloak.userDescription'
                            defaultMessage='Enter https://<your-keycloak-url>/api/v3/user.   Make sure you use HTTP or HTTPS in your URL depending on your server configuration.'
                        />
                    }
                    value={this.state.userApiEndpoint}
                    onChange={this.handleChange}
                    disabled={!this.state.enable}
                />
                <TextSetting
                    id='authEndpoint'
                    label={
                        <FormattedMessage
                            id='admin.keycloak.authTitle'
                            defaultMessage='Auth Endpoint:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.keycloak.authExample', 'Ex "https://<your-keycloak-url>/oauth/authorize"')}
                    helpText={
                        <FormattedMessage
                            id='admin.keycloak.authDescription'
                            defaultMessage='Enter https://<your-keycloak-url>/oauth/authorize (example https://example.com:3000/oauth/authorize).   Make sure you use HTTP or HTTPS in your URL depending on your server configuration.'
                        />
                    }
                    value={this.state.authEndpoint}
                    onChange={this.handleChange}
                    disabled={!this.state.enable}
                />
                <TextSetting
                    id='tokenEndpoint'
                    label={
                        <FormattedMessage
                            id='admin.keycloak.tokenTitle'
                            defaultMessage='Token Endpoint:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.keycloak.tokenExample', 'Ex "https://<your-keycloak-url>/oauth/token"')}
                    helpText={
                        <FormattedMessage
                            id='admin.keycloak.tokenDescription'
                            defaultMessage='Enter https://<your-keycloak-url>/oauth/token.   Make sure you use HTTP or HTTPS in your URL depending on your server configuration.'
                        />
                    }
                    value={this.state.tokenEndpoint}
                    onChange={this.handleChange}
                    disabled={!this.state.enable}
                />
            </SettingsGroup>
        );
    }
}
