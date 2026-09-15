
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopStruggles from "../components/TopStruggles";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="container py-4 text-light">
        Please log in to view your dashboard.
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Payment / Pro Plan Card */}
      <div
        className="card border-0 shadow-lg mb-4"
        style={{
          backgroundColor: "#0F172A",
          color: "white",
          borderRadius: "16px",
        }}
      >
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h3 className="fw-bold mb-2">
                🚀 AI Digital Twin Pro
              </h3>

              <p className="text-light mb-2">
                Unlock premium features and get a better
                personalized learning experience.
              </p>

              <small className="text-secondary">
                Pro Plan • ₹499
              </small>
            </div>

            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <Link
                to="/payment"
                className="btn btn-primary px-4 py-2"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Top Struggles */}
      <TopStruggles studentId={user.student_id} />
    </div>
  );
}


