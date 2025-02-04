// // //

import "@babel/polyfill";
import { displayMap } from "./leaflet";
import { login, logout, signup } from "./auth";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";
import { showAlert } from "./alerts";

// ⏺ ALL DOM ELEMENT
const mapElement = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logoutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const signupForm = document.querySelector(".form--signup");
const bookBtn = document.getElementById("book-tour");
const alertMessage = document.querySelector("body").dataset.alert;

// ⏺ MAP
if (mapElement) {
  const locations = JSON.parse(mapElement.dataset.locations);
  displayMap(locations);
}

// ⏺ LOGIN
if (loginForm)
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });

// ⏺ LOGOUT
if (logoutBtn) logoutBtn.addEventListener("click", logout);

// ⏺ UPDATE USER
if (userDataForm)
  userDataForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(); // ⏺ FormData() is a JavaScript object used to collect form data and send it, including files in HTTP requests
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    // console.log(form);

    updateSettings(form, "data");
  });

// ⏺ UPDATE USER PASSWORD
if (userPasswordForm)
  userPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating....";
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );

    document.querySelector(".btn--save-password").textContent = "Save password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });

// ⏺ SIGNUP
if (signupForm) {
  // Getting name, email and password from "/signup" form
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    signup(name, email, password, passwordConfirm);
  });
}

// ⏺ BOOKING
if (bookBtn)
  bookBtn.addEventListener("click", (e) => {
    e.preventDefault();

    e.target.textContent = "Processing....";
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

// ⏺ ALERT
if (alertMessage) showAlert("success", alertMessage, 6);
