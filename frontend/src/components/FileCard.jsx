import { Card, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap'

function formatDate(date) {
  if (!date) return 'Unknown date'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown date'
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function FilePreview({ file }) {
  if (file.previewType === 'image' && file.previewUrl) {
    return (
      <div className="file-preview-wrapper">
        <img
          src={file.previewUrl}
          alt=""
          className="file-preview"
        />
      </div>
    )
  }

  return (
    <div className="file-preview-wrapper">
      <div className="file-preview-placeholder">
        <div className="file-type-badge">
          PDF
        </div>

        <i
          className="bi bi-file-earmark-pdf-fill"
          aria-hidden="true"
        />

        <span>PDF DOCUMENT</span>
      </div>
    </div>
  )
}

export default function FileCard({
  file,
  onClick,
  onDelete,
}) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.(event)
    }
  }

  const handleDownload = (event) => {
    event.stopPropagation()

    console.log('Download:', file.name)
  }

  const handleShare = async (event) => {
    event.stopPropagation()

    try {
      if (navigator.share) {
        await navigator.share({
          title: file.name,
          text: `${file.name} - ${file.subject || 'Unknown'}`,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(file.name)

        alert('File name copied to clipboard.')
      }
    } catch (error) {
      console.log('Share cancelled or failed:', error)
    }
  }

  const handleDelete = (event) => {
    event.stopPropagation()

    onDelete?.(file)
  }

  return (
    <>
      <style>
        {`
          .modern-file-card {
            width: 100%;
            height: 190px;
            padding: 10px;
            background: #121212;
            border: 1px solid #252525 !important;
            border-radius: 18px;
            cursor: pointer;
            transition:
              transform 0.2s ease,
              border-color 0.2s ease,
              background-color 0.2s ease;
            overflow: visible;
          }

          .modern-file-card:hover {
            transform: translateY(-2px);
            border-color: #3a3a3a !important;
            background: #141414;
          }

          .modern-file-card:focus-visible {
            outline: 2px solid #555;
            outline-offset: 2px;
          }

          .file-preview-wrapper {
            position: relative;
            width: 100%;
            height: 108px;
            overflow: hidden;
            border-radius: 14px;
            background: #0e141a;
            border: 1px solid #292929;
          }

          .file-preview {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .file-preview-placeholder {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
            color: #8f98a3;
          }

          .file-preview-placeholder i {
            font-size: 30px;
            line-height: 1;
          }

          .file-preview-placeholder span {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.7px;
          }

          .file-type-badge {
            position: absolute;
            top: 8px;
            left: 8px;
            padding: 3px 7px;
            border-radius: 5px;
            background: #242424;
            color: #c7c7c7;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.3px;
          }

          .file-information {
            min-width: 0;
            padding: 9px 2px 0;
          }

          .file-name-row {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            height: 22px;
          }

          .file-name-container {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 1;
            min-width: 0;
          }

          .file-name-icon {
            flex-shrink: 0;
            color: #8a94a6;
            font-size: 12px;
          }

          .file-name {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            color: #f1f1f1;
            font-size: 14px;
            font-weight: 600;
            line-height: 1.3;
          }

          .file-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 5px;
            min-width: 0;
          }

          .file-subject {
            min-width: 0;
            flex: 1;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            color: #9ca3af;
            font-size: 12px;
            line-height: 1.3;
          }

          .file-date {
            flex-shrink: 0;
            color: #777;
            font-size: 11px;
            line-height: 1.3;
          }

          .file-card-menu {
            flex-shrink: 0;
            position: relative;
            z-index: 5;
          }

          .file-menu-button {
            display: flex !important;
            align-items: center;
            justify-content: center;
            width: 25px;
            height: 25px;
            color: #8f98a3 !important;
            text-decoration: none !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 6px !important;
            background: transparent !important;
            box-shadow: none !important;
            transition:
              color 0.15s ease,
              background-color 0.15s ease;
          }

          .file-menu-button::after {
            display: none !important;
          }

          .file-menu-button:hover,
          .file-menu-button:focus {
            color: #fff !important;
            background: #242424 !important;
          }

          .file-menu-button i {
            font-size: 16px;
            line-height: 1;
          }

          .file-card-dropdown {
            min-width: 155px;
            padding: 6px;
            background: #1b1b1b !important;
            border: 1px solid #303030 !important;
            border-radius: 10px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35) !important;
          }

          .file-card-dropdown .dropdown-item {
            display: flex;
            align-items: center;
            padding: 8px 10px;
            border-radius: 7px;
            color: #ddd !important;
            font-size: 13px;
            transition: background-color 0.15s ease;
          }

          .file-card-dropdown .dropdown-item:hover,
          .file-card-dropdown .dropdown-item:focus {
            background: #2a2a2a !important;
            color: #fff !important;
          }

          .file-card-dropdown .dropdown-divider {
            border-color: #333 !important;
            margin: 5px 0;
          }

          .file-card-dropdown .file-delete-item {
            color: #ff6b6b !important;
          }

          .file-card-dropdown .file-delete-item:hover,
          .file-card-dropdown .file-delete-item:focus {
            background: rgba(255, 75, 75, 0.1) !important;
            color: #ff7b7b !important;
          }
        `}
      </style>

      <Card
        as="div"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className="modern-file-card border-0 text-start text-light"
      >
        <Card.Body className="p-0 h-100">
          <FilePreview file={file} />

          {/* File information stays INSIDE the card */}
          <div className="file-information">
            <div className="file-name-row">

              <div className="file-name-container">
                <i
                  className="bi bi-file-earmark-pdf-fill file-name-icon"
                  aria-hidden="true"
                />

                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id={`tooltip-file-${file.id}`}>
                      {file.name}
                    </Tooltip>
                  }
                >
                  <span className="file-name">
                    {file.name}
                  </span>
                </OverlayTrigger>
              </div>

              {/* Three-dot dropdown */}
              <div
                className="file-card-menu"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <Dropdown align="end">
                  <Dropdown.Toggle
                    as="button"
                    aria-label={`${file.name} menu`}
                    className="file-menu-button"
                  >
                    <i
                      className="bi bi-three-dots-vertical"
                      aria-hidden="true"
                    />
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="file-card-dropdown">

                    <Dropdown.Item
                      onClick={(event) => {
                        event.stopPropagation()
                        onClick?.(event)
                      }}
                    >
                      <i className="bi bi-folder2-open me-2" />
                      Open
                    </Dropdown.Item>

                    <Dropdown.Item
                      onClick={handleDownload}
                    >
                      <i className="bi bi-download me-2" />
                      Download
                    </Dropdown.Item>

                    <Dropdown.Item
                      onClick={handleShare}
                    >
                      <i className="bi bi-share me-2" />
                      Share
                    </Dropdown.Item>

                    <Dropdown.Divider />

                    <Dropdown.Item
                      className="file-delete-item"
                      onClick={handleDelete}
                    >
                      <i className="bi bi-trash3 me-2" />
                      Delete
                    </Dropdown.Item>

                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>

            {/* Subject + Date — inside the card */}
            <div className="file-meta">

              <span
                className="file-subject"
                title={file.subject || 'Unknown'}
              >
                {file.subject || 'Unknown'}
              </span>

              <span className="file-date">
                {formatDate(file.uploadedAt)}
              </span>

            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  )
}

