
import React, {
  useContext,
  useEffect,
  useState,
} from "react";

import { AuthContext } from "../context/AuthContext";

const API_URL = "http://localhost:8000";

export default function TopStruggles() {
  const { user } = useContext(AuthContext);

  const [struggles, setStruggles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentId = user?.student_id || user?.id;

  useEffect(() => {
    let cancelled = false;

    const fetchTopStruggles = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/v1/struggles/${studentId}`
        );

        if (!response.ok) {
          throw new Error(
            `Struggle API failed: ${response.status}`
          );
        }

        const data = await response.json();

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data?.top_struggles)
          ? data.top_struggles
          : Array.isArray(data?.struggles)
          ? data.struggles
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : [];

        if (!cancelled) {
          setStruggles(records.slice(0, 5));
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load top struggles.");
          setStruggles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTopStruggles();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (loading) {
    return (
      <div className="top-struggles">
        <h3>Top Struggles</h3>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-struggles">
        <h3>Top Struggles</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="top-struggles">
      <h3>Top Struggles</h3>

      {struggles.length === 0 ? (
        <p>No struggle data available.</p>
      ) : (
        <div className="struggle-list">
          {struggles.map((item, index) => {
            const mastery =
              Number(item.mastery_percentage) || 0;

            const score =
              Number(item.struggle_score) || 0;

            return (
              <div
                className="struggle-item"
                key={item.topic || index}
              >
                <div className="struggle-rank">
                  {index + 1}
                </div>

                <div className="struggle-info">
                  <div className="struggle-topic">
                    {item.topic || "Unknown Topic"}
                  </div>

                  <div className="struggle-subject">
                    {item.subject || "General"}
                  </div>
                </div>

                <div className="struggle-values">
                  <div className="struggle-score">
                    {score.toFixed(2)}
                  </div>

                  <div className="struggle-mastery">
                    {mastery.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .top-struggles {
  background: #0F172A;
  border: 1px solid #1e3a5f;
  border-radius: 16px;
  padding: 20px;
  color: #ffffff;
}

.top-struggles h3 {
  margin: 0 0 18px;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.top-struggles p {
  color: #a0a0a0;
  font-size: 14px;
}

.struggle-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.struggle-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(145deg, #16213e, #0f3460);
  border: 1px solid #1e3a5f;
}

.struggle-item:hover {
  transform: translateY(-2px);
  border-color: #3a6ea5;
}

.struggle-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #0f3460;
  border: 1px solid #3a6ea5;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.struggle-info {
  flex: 1;
  min-width: 0;
}

.struggle-topic {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.struggle-subject {
  margin-top: 3px;
  color: #b8c4d9;
  font-size: 11px;
}

.struggle-values {
  text-align: right;
  flex-shrink: 0;
}

.struggle-score {
  color: #ffffff;
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
}

.struggle-mastery {
  color: #b8c4d9;
  font-family: monospace;
  font-size: 11px;
  margin-top: 2px;
}
      `}</style>
    </div>
  );
}

