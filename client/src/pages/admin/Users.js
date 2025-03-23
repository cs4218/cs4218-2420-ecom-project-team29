import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';
import { useAuth } from '../../context/auth';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [auth, setAuth] = useAuth();

  //getall users
  const getAllUsers = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/all-users");
      // console.log(data);
      setUsers(data.users);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    if (auth?.token) getAllUsers();
  }, [auth?.token]);

  return (
    <Layout title={"Dashboard - All Users"}>
      <div className="container-fluid p-5">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>All Users</h1>
            <div className="d-flex flex-wrap">
              {users?.map((u) => (
                <div className="card m-2" style={{ width: "18rem" }} key={u._id}>
                  <div className="card-body">
                    <h5 className="card-title">{u.name}</h5>
                    <p className="card-text mb-0">{"Email: " + u.email}</p>
                    <p className="card-text mb-0">{"Address: " + u.address}</p>
                    <p className="card-text mb-0">{"Phone: " + u.phone}</p>
                    <p className="card-text mb-0">{u.role === 1 ? "Role: Admin" : "Role: User"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users;