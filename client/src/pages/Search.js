import React from "react";
import Layout from "./../components/Layout";
import { useSearch } from "../context/search";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
const Search = () => {
  const [auth] = useAuth();
  const [cart, setCart] = useAuth();
  const [values, setValues] = useSearch();
  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="text-center">
          <h1>Search Resuts</h1>
          <h6>
            {values?.results.length < 1
              ? "No Products Found"
              : `Found ${values?.results.length}`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {values?.results.map((p) => (
              <div key={p._id} className="card m-2" style={{ width: "18rem" }}>
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body">
                  <h5 className="card-title">{p.name}</h5>
                  <p className="card-text">
                    {p.description.substring(0, 30)}...
                  </p>
                  <p className="card-text"> $ {p.price}</p>
                  <button className="btn btn-primary ms-1">More Details</button>
                  <button
                    className="btn btn-dark ms-1"
                    onClick={() => {
                      if (!auth?.user?.email) {
                        toast.error("Please log in to add items to the cart");
                        return;
                      }

                      const userCartKey = `cart${auth.user.email}`;
                      console.log(p._id);
                      const updatedCart = [...cart, p._id];

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
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
