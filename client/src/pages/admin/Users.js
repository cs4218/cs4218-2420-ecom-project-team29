import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';

const Users = () => {
  const [users, setUsers] = useState([]);

  //getall users
  const getAllUsers = async () => {
    try {
      const { data } = await axios.get("/api/v1/user/all-users");
      console.log(data);
      setUsers(data.users);
    } catch (error) {
      console.log(error);
      toast.error("Someething Went Wrong");
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <Layout title={"Dashboard - All Users"}>
      <div className="container-fluid m-3 p-3">
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