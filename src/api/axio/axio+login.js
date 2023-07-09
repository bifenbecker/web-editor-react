// import {
//     Alert,
// } from 'react-native';

// import { translate } from "../modules/Translation";

export async function registerUser() {
  const ip = "127.0.0.2";

  this.userId = undefined;
  this.isLoggedIn = false;

  try {
    var response = await this.clientCall("RegisterUser", {
      username: this.username,
      pswd: this.password,
      domain: this.domain,
      clientInfo: this.clientInfo,
      ipaddr: ip ? ip : "",
      socket: this.socket,
    });

    var userId = Number(response?.RegisterUserResult);
    if (userId < 1) {
      switch (userId) {
        case 0:
          throw { error: "login_error_name" };
        case -1:
          throw { error: "login_error_password" };
        default:
          throw { error: "login_error_unknown", id: userId };
      }
    }

    this.userId = userId;
    this.isLoggedIn = true;

    this.current = {};

    this.logger.log(`Logged in as ${this.username} with id ${this.userId}`);
  } catch (error) {
    if (error.message === "Network Error")
      error = { error: "login_error_network" };

    const errorMessage =
      typeof error.id === "undefined"
        ? error.error
        : `${error.error} with code ${error.id}`;
    this.logger.log(`Logging in failed with error ${errorMessage}`);
    alert("term_auth_error");
    // Alert.alert(
    //     translate('term_auth_error'),
    //     typeof error.id === 'undefined' ? translate('term_'+error.error) : `${translate('term_'+error.error)} with code ${error.id}`,
    // );
  }
}

export async function unregisterUser() {
  const ip = "127.0.0.2";

  try {
    var response = await this.clientCall("UnregisterUser", {
      userid: this.userId,
    });

    var id = Number(response?.UnregisterUserResult);

    this.userId = undefined;
    this.isLoggedIn = undefined;

    this.current = {};

    this.logger.log(`Logged out with result ${id}`);
  } catch (error) {
    this.logger.log(`Logging out failed with error ${error}`);
  }
}
