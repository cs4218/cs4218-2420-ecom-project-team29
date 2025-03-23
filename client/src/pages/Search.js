import React from "react";
import Layout from "./../components/Layout";
import { useSearch } from "../context/search";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import "../styles/SearchStyles.css";


const Search = () => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [values, setValues] = useSearch();
  return (
    <Layout title={"Search results"}>
      <div className="container search">
        <div >
          <div className="text-center">
            <h1>Search Results</h1>
            <h6>
              {values?.results.length < 1
                ? "No Products Found"
                : `Found ${values?.results.length}`}
            </h6>
          </div>
          
          <div className="d-flex flex-wrap mt-4">
            {values?.results.map((p) => (
              <div key={p._id} className="card m-2">
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body">
                  <div className="card-name-price">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-price"> {p.price.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}</p>
                  </div>
                  <p className="card-text">
                    {p.description.substring(0, 50)}...
                  </p>
                  <div className="card-name-price"> 

                    <button 
                      className="btn btn-info ms-1"
                      onClick={() => navigate(`/product/${p.slug}`)}
                    >
                      MORE DETAILS
                    </button>
                    <button
                      className="btn btn-dark ms-1"
                      onClick={() => {
                        if (!auth?.user?.email) {
                          toast.error("Please log in to add items to the cart");
                          return;
                        }

                        const userCartKey = `cart${auth.user.email}`;
                        const updatedCart = [...cart, p._id];
                        console.log(p._id);
                        setCart(updatedCart);
                        localStorage.setItem(
                          userCartKey,
                          JSON.stringify(updatedCart)
                        );
                        toast.success("Item added to cart");
                      }}
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
