// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import SettingItemMin from '../setting_item_min.jsx';
import SettingItemMax from '../setting_item_max.jsx';
import AccessHistoryModal from '../access_history_modal.jsx';
import ActivityLogModal from '../activity_log_modal.jsx';
import ToggleModalButton from '../toggle_modal_button.jsx';

import PreferenceStore from 'stores/preference_store.jsx';

import * as AsyncClient from 'utils/async_client.jsx';
import * as Utils from 'utils/utils.jsx';
import Constants from 'utils/constants.jsx';

import {updatePassword, getAuthorizedApps, deactivateMfa, deauthorizeOAuthApp} from 'actions/user_actions.jsx';

import $ from 'jquery';
import React from 'react';
import {FormattedMessage, FormattedTime, FormattedDate} from 'react-intl';
import {browserHistory, Link} from 'react-router/es6';

import icon50 from 'images/icon50x50.png';

export default class SecurityTab extends React.Component {
    constructor(props) {
        super(props);

        this.submitPassword = this.submitPassword.bind(this);
        this.setupMfa = this.setupMfa.bind(this);
        this.removeMfa = this.removeMfa.bind(this);
        this.updateCurrentPassword = this.updateCurrentPassword.bind(this);
        this.updateNewPassword = this.updateNewPassword.bind(this);
        this.updateConfirmPassword = this.updateConfirmPassword.bind(this);
        this.getDefaultState = this.getDefaultState.bind(this);
        this.createPasswordSection = this.createPasswordSection.bind(this);
        this.createSignInSection = this.createSignInSection.bind(this);
        this.createOAuthAppsSection = this.createOAuthAppsSection.bind(this);
        this.deauthorizeApp = this.deauthorizeApp.bind(this);

        this.state = this.getDefaultState();
    }

    getDefaultState() {
        return {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            passwordError: '',
            serverError: '',
            authService: this.props.user.auth_service
        };
    }

    componentDidMount() {
        if (global.mm_config.EnableOAuthServiceProvider === 'true') {
            getAuthorizedApps(
                (authorizedApps) => {
                    this.setState({authorizedApps, serverError: null}); //eslint-disable-line react/no-did-mount-set-state
                },
                (err) => {
                    this.setState({serverError: err.message}); //eslint-disable-line react/no-did-mount-set-state
                });
        }
    }

    submitPassword(e) {
        e.preventDefault();

        var user = this.props.user;
        var currentPassword = this.state.currentPassword;
        var newPassword = this.state.newPassword;
        var confirmPassword = this.state.confirmPassword;

        if (currentPassword === '') {
            this.setState({passwordError: Utils.localizeMessage('user.settings.security.currentPasswordError', 'Please enter your current password.'), serverError: ''});
            return;
        }

        const passwordErr = Utils.isValidPassword(newPassword);
        if (passwordErr !== '') {
            this.setState({
                passwordError: passwordErr,
                serverError: ''
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            var defaultState = Object.assign(this.getDefaultState(), {passwordError: Utils.localizeMessage('user.settings.security.passwordMatchError', 'The new passwords you entered do not match.'), serverError: ''});
            this.setState(defaultState);
            return;
        }

        updatePassword(
            user.id,
            currentPassword,
            newPassword,
            () => {
                this.props.updateSection('');
                AsyncClient.getMe();
                this.setState(this.getDefaultState());
            },
            (err) => {
                var state = this.getDefaultState();
                if (err.message) {
                    state.serverError = err.message;
                } else {
                    state.serverError = err;
                }
                state.passwordError = '';
                this.setState(state);
            }
        );
    }

    setupMfa(e) {
        e.preventDefault();
        browserHistory.push('/mfa/setup');
    }

    removeMfa() {
        deactivateMfa(
            () => {
                if (global.window.mm_license.MFA === 'true' &&
                        global.window.mm_config.EnableMultifactorAuthentication === 'true' &&
                        global.window.mm_config.EnforceMultifactorAuthentication === 'true') {
                    window.location.href = '/mfa/setup';
                    return;
                }

                this.props.updateSection('');
                this.setState(this.getDefaultState());
            },
            (err) => {
                const state = this.getDefaultState();
                if (err.message) {
                    state.serverError = err.message;
                } else {
                    state.serverError = err;
                }
                this.setState(state);
            }
        );
    }

    updateCurrentPassword(e) {
        this.setState({currentPassword: e.target.value});
    }

    updateNewPassword(e) {
        this.setState({newPassword: e.target.value});
    }

    updateConfirmPassword(e) {
        this.setState({confirmPassword: e.target.value});
    }

    deauthorizeApp(e) {
        e.preventDefault();
        const appId = e.currentTarget.getAttribute('data-app');
        deauthorizeOAuthApp(
            appId,
            () => {
                const authorizedApps = this.state.authorizedApps.filter((app) => {
                    return app.id !== appId;
                });

                this.setState({authorizedApps, serverError: null});
            },
            (err) => {
                this.setState({serverError: err.message});
            });
    }

    createMfaSection() {
        let updateSectionStatus;
        let submit;

        if (this.props.activeSection === 'mfa') {
            let content;
            let extraInfo;
            if (this.props.user.mfa_active) {
                let mfaRemoveHelp;
                let mfaButtonText;

                if (global.window.mm_config.EnforceMultifactorAuthentication === 'true') {
                    mfaRemoveHelp = (
                        <FormattedMessage
                            id='user.settings.mfa.requiredHelp'
                            defaultMessage='Multi-factor authentication is required on this server. Resetting is only recommended when you need to switch code generation to a new mobile device. You will be required to set it up again immediately.'
                        />
                    );

                    mfaButtonText = (
                        <FormattedMessage
                            id='user.settings.mfa.reset'
                            defaultMessage='Reset MFA on your account'
                        />
                    );
                } else {
                    mfaRemoveHelp = (
                        <FormattedMessage
                            id='user.settings.mfa.removeHelp'
                            defaultMessage='Removing multi-factor authentication means you will no longer require a phone-based passcode to sign-in to your account.'
                        />
                    );

                    mfaButtonText = (
                        <FormattedMessage
                            id='user.settings.mfa.remove'
                            defaultMessage='Remove MFA from your account'
                        />
                    );
                }

                content = (
                    <div key='mfaQrCode'>
                        <a
                            className='btn btn-primary'
                            href='#'
                            onClick={this.removeMfa}
                        >
                            {mfaButtonText}
                        </a>
                        <br/>
                    </div>
                );

                extraInfo = (
                    <span>
                        {mfaRemoveHelp}
                    </span>
                );
            } else {
                content = (
                    <div key='mfaQrCode'>
                        <a
                            className='btn btn-primary'
                            href='#'
                            onClick={this.setupMfa}
                        >
                            <FormattedMessage
                                id='user.settings.mfa.add'
                                defaultMessage='Add MFA to your account'
                            />
                        </a>
                        <br/>
                    </div>
                );

                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.mfa.addHelp'
                            defaultMessage='Adding multi-factor authentication will make your account more secure by requiring a code from your mobile phone each time you sign in.'
                        />
                    </span>
                );
            }

            const inputs = [];
            inputs.push(
                <div
                    key='mfaSetting'
                    className='padding-top'
                >
                    {content}
                </div>
            );

            updateSectionStatus = function resetSection(e) {
                this.props.updateSection('');
                this.setState({serverError: null});
                e.preventDefault();
            }.bind(this);

            return (
                <SettingItemMax
                    title={Utils.localizeMessage('user.settings.mfa.title', 'Multi-factor Authentication')}
                    inputs={inputs}
                    extraInfo={extraInfo}
                    submit={submit}
                    server_error={this.state.serverError}
                    updateSection={updateSectionStatus}
                    width='medium'
                />
            );
        }

        let describe;
        if (this.props.user.mfa_active) {
            describe = Utils.localizeMessage('user.settings.security.active', 'Active');
        } else {
            describe = Utils.localizeMessage('user.settings.security.inactive', 'Inactive');
        }

        updateSectionStatus = function updateSection() {
            this.props.updateSection('mfa');
        }.bind(this);

        return (
            <SettingItemMin
                title={Utils.localizeMessage('user.settings.mfa.title', 'Multi-factor Authentication')}
                describe={describe}
                updateSection={updateSectionStatus}
            />
        );
    }

    createPasswordSection() {
        let updateSectionStatus;

        if (this.props.activeSection === 'password') {
            const inputs = [];
            let submit;

            if (this.props.user.auth_service === '') {
                submit = this.submitPassword;

                inputs.push(
                    <div
                        key='currentPasswordUpdateForm'
                        className='form-group'
                    >
                        <label className='col-sm-5 control-label'>
                            <FormattedMessage
                                id='user.settings.security.currentPassword'
                                defaultMessage='Current Password'
                            />
                        </label>
                        <div className='col-sm-7'>
                            <input
                                className='form-control'
                                type='password'
                                onChange={this.updateCurrentPassword}
                                value={this.state.currentPassword}
                            />
                        </div>
                    </div>
                );
                inputs.push(
                    <div
                        key='newPasswordUpdateForm'
                        className='form-group'
                    >
                        <label className='col-sm-5 control-label'>
                            <FormattedMessage
                                id='user.settings.security.newPassword'
                                defaultMessage='New Password'
                            />
                        </label>
                        <div className='col-sm-7'>
                            <input
                                className='form-control'
                                type='password'
                                onChange={this.updateNewPassword}
                                value={this.state.newPassword}
                            />
                        </div>
                    </div>
                );
                inputs.push(
                    <div
                        key='retypeNewPasswordUpdateForm'
                        className='form-group'
                    >
                        <label className='col-sm-5 control-label'>
                            <FormattedMessage
                                id='user.settings.security.retypePassword'
                                defaultMessage='Retype New Password'
                            />
                        </label>
                        <div className='col-sm-7'>
                            <input
                                className='form-control'
                                type='password'
                                onChange={this.updateConfirmPassword}
                                value={this.state.confirmPassword}
                            />
                        </div>
                    </div>
                );
            } else if (this.props.user.auth_service === Constants.GITLAB_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint col-sm-12'>
                            <FormattedMessage
                                id='user.settings.security.passwordGitlabCantUpdate'
                                defaultMessage='Login occurs through GitLab. Password cannot be updated.'
                            />
                        </div>
                    </div>
                );
            } else if (this.props.user.auth_service === Constants.KEYCLOAK_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint col-sm-12'>
                            <FormattedMessage
                                id='user.settings.security.passwordKeycloakCantUpdate'
                                defaultMessage='Login occurs through Keycloak. Password cannot be updated.'
                            />
                        </div>
                    </div>
                );
            } else if (this.props.user.auth_service === Constants.LDAP_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint col-sm-12'>
                            <FormattedMessage
                                id='user.settings.security.passwordLdapCantUpdate'
                                defaultMessage='Login occurs through AD/LDAP. Password cannot be updated.'
                            />
                        </div>
                    </div>
                );
            } else if (this.props.user.auth_service === Constants.SAML_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint col-sm-12'>
                            <FormattedMessage
                                id='user.settings.security.passwordSamlCantUpdate'
                                defaultMessage='This field is handled through your login provider. If you want to change it, you need to do so through your login provider.'
                            />
                        </div>
                    </div>
                );
            } else if (this.props.user.auth_service === Constants.GOOGLE_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint col-sm-12'>
                            <FormattedMessage
                                id='user.settings.security.passwordGoogleCantUpdate'
                                defaultMessage='Login occurs through Google Apps. Password cannot be updated.'
                            />
                        </div>
                    </div>
                );
            } else if (this.props.user.auth_service === Constants.OFFICE365_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint col-sm-12'>
                            <FormattedMessage
                                id='user.settings.security.passwordOffice365CantUpdate'
                                defaultMessage='Login occurs through Office 365. Password cannot be updated.'
                            />
                        </div>
                    </div>
                );
            }

            updateSectionStatus = function resetSection(e) {
                this.props.updateSection('');
                this.setState({currentPassword: '', newPassword: '', confirmPassword: '', serverError: null, passwordError: null});
                e.preventDefault();
                $('.settings-modal .modal-body').scrollTop(0).perfectScrollbar('update');
            }.bind(this);

            return (
                <SettingItemMax
                    title={
                        <FormattedMessage
                            id='user.settings.security.password'
                            defaultMessage='Password'
                        />
                    }
                    inputs={inputs}
                    submit={submit}
                    server_error={this.state.serverError}
                    client_error={this.state.passwordError}
                    updateSection={updateSectionStatus}
                />
            );
        }

        let describe;

        if (this.props.user.auth_service === '') {
            const d = new Date(this.props.user.last_password_update);
            const hours12 = !PreferenceStore.getBool(Constants.Preferences.CATEGORY_DISPLAY_SETTINGS, Constants.Preferences.USE_MILITARY_TIME, false);

            describe = (
                <FormattedMessage
                    id='user.settings.security.lastUpdated'
                    defaultMessage='Last updated {date} at {time}'
                    values={{
                        date: (
                            <FormattedDate
                                value={d}
                                day='2-digit'
                                month='short'
                                year='numeric'
                            />
                        ),
                        time: (
                            <FormattedTime
                                value={d}
                                hour12={hours12}
                                hour='2-digit'
                                minute='2-digit'
                            />
                        )
                    }}
                />
            );
        } else if (this.props.user.auth_service === Constants.GITLAB_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.loginGitlab'
                    defaultMessage='Login done through GitLab'
                />
            );
        } else if (this.props.user.auth_service === Constants.LDAP_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.loginLdap'
                    defaultMessage='Login done through AD/LDAP'
                />
            );
        } else if (this.props.user.auth_service === Constants.SAML_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.loginSaml'
                    defaultMessage='Login done through SAML'
                />
            );
        } else if (this.props.user.auth_service === Constants.GOOGLE_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.loginGoogle'
                    defaultMessage='Login done through Google Apps'
                />
            );
        } else if (this.props.user.auth_service === Constants.OFFICE365_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.loginOffice365'
                    defaultMessage='Login done through Office 365'
                />
            );
        }

        updateSectionStatus = function updateSection() {
            this.props.updateSection('password');
        }.bind(this);

        return (
            <SettingItemMin
                title={
                    <FormattedMessage
                        id='user.settings.security.password'
                        defaultMessage='Password'
                    />
                }
                describe={describe}
                updateSection={updateSectionStatus}
            />
        );
    }

    createSignInSection() {
        let updateSectionStatus;
        const user = this.props.user;

        if (this.props.activeSection === 'signin') {
            let emailOption;
            let gitlabOption;
            let googleOption;
            let office365Option;
            let ldapOption;
            let samlOption;

            if (user.auth_service === '') {
                if (global.window.mm_config.EnableSignUpWithGitLab === 'true') {
                    gitlabOption = (
                        <div className='padding-bottom x2'>
                            <Link
                                className='btn btn-primary'
                                to={'/claim/email_to_oauth?email=' + encodeURIComponent(user.email) + '&old_type=' + user.auth_service + '&new_type=' + Constants.GITLAB_SERVICE}
                            >
                                <FormattedMessage
                                    id='user.settings.security.switchGitlab'
                                    defaultMessage='Switch to using GitLab SSO'
                                />
                            </Link>
                            <br/>
                        </div>
                    );
                }

                if (global.window.mm_config.EnableSignUpWithGoogle === 'true') {
                    googleOption = (
                        <div className='padding-bottom x2'>
                            <Link
                                className='btn btn-primary'
                                to={'/claim/email_to_oauth?email=' + encodeURIComponent(user.email) + '&old_type=' + user.auth_service + '&new_type=' + Constants.GOOGLE_SERVICE}
                            >
                                <FormattedMessage
                                    id='user.settings.security.switchGoogle'
                                    defaultMessage='Switch to using Google SSO'
                                />
                            </Link>
                            <br/>
                        </div>
                    );
                }

                if (global.window.mm_config.EnableSignUpWithOffice365 === 'true') {
                    office365Option = (
                        <div className='padding-bottom x2'>
                            <Link
                                className='btn btn-primary'
                                to={'/claim/email_to_oauth?email=' + encodeURIComponent(user.email) + '&old_type=' + user.auth_service + '&new_type=' + Constants.OFFICE365_SERVICE}
                            >
                                <FormattedMessage
                                    id='user.settings.security.switchOffice365'
                                    defaultMessage='Switch to using Office 365 SSO'
                                />
                            </Link>
                            <br/>
                        </div>
                    );
                }

                if (global.window.mm_config.EnableLdap === 'true') {
                    ldapOption = (
                        <div className='padding-bottom x2'>
                            <Link
                                className='btn btn-primary'
                                to={'/claim/email_to_ldap?email=' + encodeURIComponent(user.email)}
                            >
                                <FormattedMessage
                                    id='user.settings.security.switchLdap'
                                    defaultMessage='Switch to using AD/LDAP'
                                />
                            </Link>
                            <br/>
                        </div>
                    );
                }

                if (global.window.mm_config.EnableSaml === 'true') {
                    samlOption = (
                        <div className='padding-bottom x2'>
                            <Link
                                className='btn btn-primary'
                                to={'/claim/email_to_oauth?email=' + encodeURIComponent(user.email) + '&old_type=' + user.auth_service + '&new_type=' + Constants.SAML_SERVICE}
                            >
                                <FormattedMessage
                                    id='user.settings.security.switchSaml'
                                    defaultMessage='Switch to using SAML SSO'
                                />
                            </Link>
                            <br/>
                        </div>
                    );
                }
            } else if (global.window.mm_config.EnableSignUpWithEmail === 'true') {
                let link;
                if (user.auth_service === Constants.LDAP_SERVICE) {
                    link = '/claim/ldap_to_email?email=' + encodeURIComponent(user.email);
                } else {
                    link = '/claim/oauth_to_email?email=' + encodeURIComponent(user.email) + '&old_type=' + user.auth_service;
                }

                emailOption = (
                    <div className='padding-bottom x2'>
                        <Link
                            className='btn btn-primary'
                            to={link}
                        >
                            <FormattedMessage
                                id='user.settings.security.switchEmail'
                                defaultMessage='Switch to using email and password'
                            />
                        </Link>
                        <br/>
                    </div>
                );
            }

            const inputs = [];
            inputs.push(
                <div key='userSignInOption'>
                    {emailOption}
                    {gitlabOption}
                    {googleOption}
                    {office365Option}
                    {ldapOption}
                    {samlOption}
                </div>
            );

            updateSectionStatus = function updateSection(e) {
                this.props.updateSection('');
                this.setState({serverError: null});
                e.preventDefault();
            }.bind(this);

            const extraInfo = (
                <span>
                    <FormattedMessage
                        id='user.settings.security.oneSignin'
                        defaultMessage='You may only have one sign-in method at a time. Switching sign-in method will send an email notifying you if the change was successful.'
                    />
                </span>
            );

            return (
                <SettingItemMax
                    title={Utils.localizeMessage('user.settings.security.method', 'Sign-in Method')}
                    extraInfo={extraInfo}
                    inputs={inputs}
                    server_error={this.state.serverError}
                    updateSection={updateSectionStatus}
                />
            );
        }

        updateSectionStatus = function updateSection() {
            this.props.updateSection('signin');
        }.bind(this);

        let describe = (
            <FormattedMessage
                id='user.settings.security.emailPwd'
                defaultMessage='Email and Password'
            />
        );
        if (this.props.user.auth_service === Constants.GITLAB_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.gitlab'
                    defaultMessage='GitLab'
                />
            );
        } else if (this.props.user.auth_service === Constants.GOOGLE_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.google'
                    defaultMessage='Google'
                />
            );
        } else if (this.props.user.auth_service === Constants.OFFICE365_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.office365'
                    defaultMessage='Office 365'
                />
            );
        } else if (this.props.user.auth_service === Constants.LDAP_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.ldap'
                    defaultMessage='AD/LDAP'
                />
            );
        } else if (this.props.user.auth_service === Constants.SAML_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.security.saml'
                    defaultMessage='SAML'
                />
            );
        }

        return (
            <SettingItemMin
                title={Utils.localizeMessage('user.settings.security.method', 'Sign-in Method')}
                describe={describe}
                updateSection={updateSectionStatus}
            />
        );
    }

    createOAuthAppsSection() {
        let updateSectionStatus;

        if (this.props.activeSection === 'apps') {
            let apps;
            if (this.state.authorizedApps && this.state.authorizedApps.length > 0) {
                apps = this.state.authorizedApps.map((app) => {
                    const homepage = (
                        <a
                            href={app.homepage}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            {app.homepage}
                        </a>
                    );

                    return (
                        <div
                            key={app.id}
                            className='padding-bottom x2 authorized-app'
                        >
                            <div className='col-sm-10'>
                                <div className='authorized-app__name'>
                                    {app.name}
                                    <span className='authorized-app__url'>
                                        {' -'} {homepage}
                                    </span>
                                </div>
                                <div className='authorized-app__description'>{app.description}</div>
                                <div className='authorized-app__deauthorize'>
                                    <a
                                        href='#'
                                        data-app={app.id}
                                        onClick={this.deauthorizeApp}
                                    >
                                        <FormattedMessage
                                            id='user.settings.security.deauthorize'
                                            defaultMessage='Deauthorize'
                                        />
                                    </a>
                                </div>
                            </div>
                            <div className='col-sm-2 pull-right'>
                                <img
                                    alt={app.name}
                                    src={app.icon_url || icon50}
                                />
                            </div>
                            <br/>
                        </div>
                    );
                });
            } else {
                apps = (
                    <div className='padding-bottom x2 authorized-app'>
                        <div className='setting-list__hint'>
                            <FormattedMessage
                                id='user.settings.security.noApps'
                                defaultMessage='No OAuth 2.0 Applications are authorized.'
                            />
                        </div>
                    </div>
                );
            }

            const inputs = [];
            let wrapperClass;
            let helpText;
            if (Array.isArray(apps)) {
                wrapperClass = 'authorized-apps__wrapper';

                helpText = (
                    <div className='authorized-apps__help'>
                        <FormattedMessage
                            id='user.settings.security.oauthAppsHelp'
                            defaultMessage='Applications act on your behalf to access your data based on the permissions you grant them.'
                        />
                    </div>
                );
            }

            inputs.push(
                <div
                    className={wrapperClass}
                    key='authorizedApps'
                >
                    {apps}
                </div>
            );

            updateSectionStatus = function updateSection(e) {
                this.props.updateSection('');
                this.setState({serverError: null});
                e.preventDefault();
            }.bind(this);

            const title = (
                <div>
                    <FormattedMessage
                        id='user.settings.security.oauthApps'
                        defaultMessage='OAuth 2.0 Applications'
                    />
                    {helpText}
                </div>
            );

            return (
                <SettingItemMax
                    title={title}
                    inputs={inputs}
                    server_error={this.state.serverError}
                    updateSection={updateSectionStatus}
                    width='full'
                />
            );
        }

        updateSectionStatus = function updateSection() {
            this.props.updateSection('apps');
        }.bind(this);

        return (
            <SettingItemMin
                title={Utils.localizeMessage('user.settings.security.oauthApps', 'OAuth 2.0 Applications')}
                describe={
                    <FormattedMessage
                        id='user.settings.security.oauthAppsDescription'
                        defaultMessage="Click 'Edit' to manage your OAuth 2.0 Applications"
                    />
                }
                updateSection={updateSectionStatus}
            />
        );
    }

    render() {
        const user = this.props.user;
        const config = window.mm_config;

        const passwordSection = this.createPasswordSection();

        let numMethods = 0;
        numMethods = config.EnableSignUpWithGitLab === 'true' ? numMethods + 1 : numMethods;
        numMethods = config.EnableSignUpWithGoogle === 'true' ? numMethods + 1 : numMethods;
        numMethods = config.EnableLdap === 'true' ? numMethods + 1 : numMethods;
        numMethods = config.EnableSaml === 'true' ? numMethods + 1 : numMethods;

        // If there are other sign-in methods and either email is enabled or the user's account is email, then allow switching
        let signInSection;
        if ((config.EnableSignUpWithEmail === 'true' || user.auth_service === '') && numMethods > 0) {
            signInSection = this.createSignInSection();
        }

        let mfaSection;
        if (config.EnableMultifactorAuthentication === 'true' &&
                global.window.mm_license.IsLicensed === 'true' &&
                (user.auth_service === '' || user.auth_service === Constants.LDAP_SERVICE)) {
            mfaSection = this.createMfaSection();
        }

        let oauthSection;
        if (config.EnableOAuthServiceProvider === 'true') {
            oauthSection = this.createOAuthAppsSection();
        }

        return (
            <div>
                <div className='modal-header'>
                    <button
                        type='button'
                        className='close'
                        data-dismiss='modal'
                        aria-label={Utils.localizeMessage('user.settings.security.close', 'Close')}
                        onClick={this.props.closeModal}
                    >
                        <span aria-hidden='true'>{'×'}</span>
                    </button>
                    <h4
                        className='modal-title'
                        ref='title'
                    >
                        <div className='modal-back'>
                            <i
                                className='fa fa-angle-left'
                                onClick={this.props.collapseModal}
                            />
                        </div>
                        <FormattedMessage
                            id='user.settings.security.title'
                            defaultMessage='Security Settings'
                        />
                    </h4>
                </div>
                <div className='user-settings'>
                    <h3 className='tab-header'>
                        <FormattedMessage
                            id='user.settings.security.title'
                            defaultMessage='Security Settings'
                        />
                    </h3>
                    <div className='divider-dark first'/>
                    {passwordSection}
                    <div className='divider-light'/>
                    {mfaSection}
                    <div className='divider-light'/>
                    {oauthSection}
                    <div className='divider-light'/>
                    {signInSection}
                    <div className='divider-dark'/>
                    <br/>
                    <ToggleModalButton
                        className='security-links theme'
                        dialogType={AccessHistoryModal}
                    >
                        <i className='fa fa-clock-o'/>
                        <FormattedMessage
                            id='user.settings.security.viewHistory'
                            defaultMessage='View Access History'
                        />
                    </ToggleModalButton>
                    <b/>
                    <ToggleModalButton
                        className='security-links theme'
                        dialogType={ActivityLogModal}
                    >
                        <i className='fa fa-clock-o'/>
                        <FormattedMessage
                            id='user.settings.security.logoutActiveSessions'
                            defaultMessage='View and Logout of Active Sessions'
                        />
                    </ToggleModalButton>
                </div>
            </div>
        );
    }
}

SecurityTab.defaultProps = {
    user: {},
    activeSection: ''
};
SecurityTab.propTypes = {
    user: React.PropTypes.object,
    activeSection: React.PropTypes.string,
    updateSection: React.PropTypes.func,
    updateTab: React.PropTypes.func,
    closeModal: React.PropTypes.func.isRequired,
    collapseModal: React.PropTypes.func.isRequired,
    setEnforceFocus: React.PropTypes.func.isRequired
};
