import { useState } from "react";

const PDFUpload = () => {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // HANDLE FILE
  // ==========================================================

  const handleFile = (selectedFile) => {
    setMessage("");
    setError("");

    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only PDF files are supported.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  // ==========================================================
  // HANDLE DROP
  // ==========================================================

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const droppedFile = e.dataTransfer.files[0];

    handleFile(droppedFile);
  };

  // ==========================================================
  // HANDLE UPLOAD
  // ==========================================================

  const handleUpload = async () => {
    setError("");
    setMessage("");

    // Validate subject
    if (!subject.trim()) {
      setError("Please enter the subject name.");
      return;
    }

    // Validate file
    if (!file) {
      setError("Please select a PDF first.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      // PDF
      formData.append("file", file);

      // Manually entered subject
      formData.append(
        "subject",
        subject.trim()
      );

      // Get logged-in student
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const studentId =
        storedUser.student_id ||
        storedUser.id ||
        "";

      if (!studentId) {
        throw new Error(
          "Student ID not found. Please login again."
        );
      }

      formData.append(
        "student_id",
        studentId
      );

      // Send request
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/upload-pdf",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "PDF upload failed."
        );
      }

      // Success
      setMessage(
        `PDF uploaded successfully: ${data.filename} (${data.subject})`
      );

      // Clear form
      setFile(null);
      setSubject("");

      const input =
        document.getElementById("pdfInput");

      if (input) {
        input.value = "";
      }

    } catch (err) {

      setError(
        err.message ||
        "Something went wrong."
      );

    } finally {

      setUploading(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="container py-5">

      <div className="row justify-content-center">

        <div className="col-md-8 col-lg-6">

          <div className="card shadow-sm border-0">

            <div className="card-body p-4">

              <h2 className="text-center mb-2">
                Upload Study Notes
              </h2>

              <p className="text-center text-muted mb-4">
                Enter the subject name and upload your
                study material.
              </p>

              {/* ==================================================
                  SUBJECT INPUT
              ================================================== */}

              <div className="mb-4">

                <label
                  htmlFor="subjectInput"
                  className="form-label fw-semibold"
                >
                  Subject Name
                </label>

                <input
                  id="subjectInput"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Operating Systems"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setError("");
                    setMessage("");
                  }}
                  disabled={uploading}
                />

                <small className="text-muted">
                  Enter the subject related to these notes.
                </small>

              </div>

              {/* ==================================================
                  PDF DROP AREA
              ================================================== */}

              <div
                className={`border rounded p-5 text-center ${
                  dragging
                    ? "border-primary bg-light"
                    : "border-secondary"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() =>
                  setDragging(false)
                }
                onDrop={handleDrop}
                style={{
                  cursor: uploading
                    ? "not-allowed"
                    : "pointer",
                }}
                onClick={() => {
                  if (!uploading) {
                    document
                      .getElementById("pdfInput")
                      .click();
                  }
                }}
              >

                <input
                  id="pdfInput"
                  type="file"
                  accept=".pdf,application/pdf"
                  hidden
                  onChange={(e) =>
                    handleFile(
                      e.target.files[0]
                    )
                  }
                  disabled={uploading}
                />

                <h5>
                  {dragging
                    ? "Drop your PDF here"
                    : "Drag & Drop your PDF here"}
                </h5>

                <p className="text-muted mb-0">
                  or click to browse
                </p>

              </div>

              {/* ==================================================
                  SELECTED FILE
              ================================================== */}

              {file && (
                <div className="alert alert-info mt-3">

                  <strong>
                    Selected file:
                  </strong>{" "}
                  {file.name}

                  <br />

                  <small>
                    Size:{" "}
                    {(file.size / 1024).toFixed(2)} KB
                  </small>

                  <br />

                  <small>
                    Subject:{" "}
                    <strong>
                      {subject || "Not entered"}
                    </strong>
                  </small>

                </div>
              )}

              {/* ==================================================
                  ERROR
              ================================================== */}

              {error && (
                <div className="alert alert-danger mt-3">
                  {error}
                </div>
              )}

              {/* ==================================================
                  SUCCESS
              ================================================== */}

              {message && (
                <div className="alert alert-success mt-3">
                  {message}
                </div>
              )}

              {/* ==================================================
                  UPLOAD BUTTON
              ================================================== */}

              <button
                className="btn btn-primary w-100 mt-3"
                onClick={handleUpload}
                disabled={
                  !file ||
                  !subject.trim() ||
                  uploading
                }
              >
                {uploading
                  ? "Uploading..."
                  : "Upload PDF"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default PDFUpload;