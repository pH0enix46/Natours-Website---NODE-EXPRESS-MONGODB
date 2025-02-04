// // //

import axios from "axios";
import { showAlert } from "./alerts";

const stripe = Stripe(
  "pk_test_51QoXhZG632GANj1HwbXC9GqsRVdncy8upgLLLO7C3ylcLyh33W0cWQktlLK4zrUaV2PEghJCW6mJMpybApqtdBeS008wTcQC5G"
);

export const bookTour = async (tourId) => {
  try {
    // 1) get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    // console.log(error);
    showAlert("error", error);
  }
};

// ⏺ demo credit card (4242 4242 4242 4242) for stripe by default
