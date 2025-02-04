// // //

import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  // console.log(email, password);
  try {
    const res = await axios({
      method: "POST",
      url: "http://127.0.0.1:3000/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      window.setTimeout(() => {
        location.assign("/"); // ⏺ location(obj) refers to the current URL, and assign() method/function changes it to a new one
      }, 1000);
    }

    // console.log(res);
  } catch (error) {
    // console.log(error.response.data);
    showAlert("error", error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://127.0.0.1:3000/api/v1/users/logout",
    });

    // ⏺ for reloading page after successfully logged out
    // if (res.data.status === "success") location.reload(true); // ⏺ reload() method/function refreshes the current page
    if (res.data.status === "success") {
      showAlert("success", "You logged out!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1000);
    }
  } catch (error) {
    console.log(error);
    showAlert("error", "Error logging out! Try again");
  }
};

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const response = await axios({
      method: "POST",
      url: "/api/v1/users/signup",
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (response.data.status === "success") {
      showAlert("success", "Account created successfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1000);
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
};
