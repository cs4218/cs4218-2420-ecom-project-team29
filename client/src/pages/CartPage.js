import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const CartPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropIn, setShowDropIn] = useState(true);
  const navigate = useNavigate();

  //total price
  const totalPrice = () => {
    let total = products.reduce((acc, item) => acc + item.price, 0);
    return total.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  //detele item
  const removeCartItem = (pid) => {
    try {
      let myCart = [...cart];
      let index = myCart.findIndex((item) => item === pid);
      myCart.splice(index, 1);
      setCart(myCart);
      localStorage.setItem(`cart${auth.user.email}`, JSON.stringify(myCart));
    } catch (error) {
      console.log(error);
    }
  };

  //get payment gateway token
  const getToken = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/braintree/token");
      setClientToken(data?.clientToken);
    } catch (error) {
      console.log("Failed to load Braintree token: ", error);
    }
  };

  // get product details
  const getProductDetails = async () => {
    if (!cart?.length) {
      setProducts([]);
      return;
    }
    try {
      // get product ids from cart in local storage
      setLoading(true);
      let cartProductIds = JSON.parse(localStorage.getItem(`cart${auth.user.email}`));
      // get product details from the server
      const { data } = await axios.get("/api/v1/product/get-product-details", {
        params: { ids: cartProductIds.join(",") },
      });
      let products = [];
      cartProductIds.forEach((item) => {
        let product = data.products.find((p) => p._id === item);
        products.push(product);
      });
      setProducts(products);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getToken();
  }, [auth?.token]);

  useEffect(() => {
    getProductDetails();
  }, [cart]);

  //handle payments
  const handlePayment = async () => {
    setLoading(true);

    console.log("Handling Payment");
    // Get payment method nonce
    instance
      .requestPaymentMethod()
      .then((paymentMethodResult) => {
        const nonce = paymentMethodResult.nonce;
        if (!nonce) {
          throw new Error("Unable to get payment information");
        }

        // Process payment with endpoint
        return axios.post("/api/v1/product/braintree/payment", {
          nonce,
          cart: products,
        });
      })
      .then((response) => {
        const { data } = response;
        if (data.ok) {
          console.log("Auth User Email: ", auth.user.email);
          localStorage.removeItem(`cart${auth.user.email}`);
          setCart([]);
          navigate("/dashboard/user/orders");
          toast.success("Payment Completed Successfully");
        } else {
          // Handle server response with error
          toast.error(data.message || "Payment failed");
          resetDropIn();
        }
      })
      .catch((error) => {
        console.log(error);
        if (error.name === "DropinError" || error.code) {
          // Braintree-specific errors
          toast.error(
            `Something went wrong with your payment information. ${error?.response?.data?.result?.message || ""}`
          );
        } else {
          // Other errors
          toast.error(
            "Something went wrong. Payment failed. Please try again or contact the relevant personnel."
          );
        }

        resetDropIn(() => setLoading(false)); 
      })
  };

  // Function to reset the DropIn component
  const resetDropIn = (callback) => {
    setShowDropIn(false);
    setTimeout(() => {
      setShowDropIn(true);
      if (callback) callback();
    }, 100);
  };
  

  return (
    <Layout>
      <div className="cart-page">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user
                ? "Hello Guest"
                : `Hello  ${auth?.token && auth?.user?.name}`}
              <p className="text-center">
                {cart?.length
                  ? `You Have ${cart.length} ${cart.length === 1 ? "item" : "items"} in your cart ${
                      auth?.token ? "" : "Please login to checkout!"
                    }`
                  : " Your Cart Is Empty"}
              </p>
            </h1>
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-7  p-0 m-0">
              {loading ? (
                <div className="text-center" data-testid="loading">
                  <h2>Loading...</h2>
                </div>
                ) : (products && products?.map((p) => (
                <div className="row card flex-row h-full" key={p._id}>
                  <div className="col-md-4">
                    <img
                      src={`/api/v1/product/product-photo/${p?._id}`}
                      className="card-img-top"
                      alt={p?.name}
                      width="100%"
                      height={"130px"}
                    />
                  </div>
                  <div className="col-md-4">
                    <p>{p.name}</p>
                    <p>{p.description}</p>
                    <p>Price : {p.price.toFixed(2)}</p>
                  </div>
                  <div className="col-md-4 cart-remove-btn">
                    <button
                      className="btn btn-danger"
                      onClick={() => removeCartItem(p._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )))}
            </div>
            <div className="col-md-5 cart-summary ">
              <h2>Cart Summary</h2>
              <p>Total | Checkout | Payment</p>
              <hr />
              <h4>Total : {totalPrice()} </h4>
              {auth?.user?.address ? (
                <>
                  <div className="mb-3">
                    <h4>Current Address</h4>
                    <h5>{auth?.user?.address}</h5>
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  {auth?.token ? (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() =>
                        navigate("/login", {
                          state: "/cart",
                        })
                      }
                    >
                      Please login to add to cart
                    </button>
                  )}
                </div>
              )}
              <div className="mt-2">
                {!clientToken ||
                !auth?.token ||
                !products?.length ||
                !showDropIn ? (
                  ""
                ) : (
                  <>
                    <DropIn
                      options={{
                        authorization: clientToken,
                      }}
                      onInstance={(instance) => setInstance(instance)}
                    />
                    <div className="alert alert-warning">
                      PayPal payment option is unavailable.
                    </div>

                    <button
                      className="btn btn-primary"
                      data-testid="make-payment"
                      onClick={handlePayment}
                      disabled={loading || !instance || !auth?.user?.address}
                    >
                      {loading ? "Processing ...." : "Make Payment"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
