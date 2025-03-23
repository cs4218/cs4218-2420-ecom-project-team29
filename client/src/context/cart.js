import React, { useState, useContext, createContext, useEffect } from "react";
import { useAuth } from "./auth";

const CartContext = createContext();
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [auth] = useAuth(); // Get auth state

  useEffect(() => {
    if (auth?.user?.email) {
      let existingCart = localStorage.getItem(`cart${auth.user.email}`);
      if (existingCart) {
        setCart(JSON.parse(existingCart));
      } else {
        localStorage.setItem(`cart${auth.user.email}`, JSON.stringify([]));
        setCart([]);
      }
    } else {
      setCart([]); 
    }
  }, [auth?.user?.email]); // Re-run when user logs in/out

  return (
    <CartContext.Provider value={[cart, setCart]}>
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };