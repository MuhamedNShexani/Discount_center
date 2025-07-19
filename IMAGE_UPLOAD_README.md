# Image Upload Functionality

This document describes the image upload functionality implemented for market logos and product images.

## Backend Implementation

### 1. Multer Middleware (`middleware/upload.js`)

- Handles file uploads with proper storage configuration
- Validates file types (images only)
- Sets file size limits (5MB)
- Creates unique filenames with timestamps

### 2. Upload Routes

- **Market Logo Upload**: `POST /api/markets/upload-logo`
- **Product Image Upload**: `POST /api/products/upload-image`

### 3. Static File Serving

- Uploaded files are served from `/uploads` directory
- Files are accessible via `http://localhost:5000/uploads/filename`

## Frontend Implementation

### 1. File Upload UI

- File input buttons for both market logos and product images
- Visual feedback showing selected filename
- Accepts only image files (`image/*`)

### 2. Upload Process

1. User selects an image file
2. File is uploaded to the backend when form is submitted
3. Backend returns the image URL
4. Image URL is saved with the market/product data

### 3. Image Display

- Images are displayed in the admin tables
- Supports both uploaded files and external URLs
- Proper error handling for missing images

## Usage

### Adding a Market with Logo

1. Fill in market details
2. Either enter a logo URL or click "Upload Logo" to select a file
3. Submit the form
4. The logo will be uploaded and displayed in the markets table

### Adding a Product with Image

1. Fill in product details
2. Either enter an image URL or click "Upload Image" to select a file
3. Submit the form
4. The image will be uploaded and displayed in the products table

## File Storage

- Uploaded files are stored in the `uploads/` directory
- Files are named with format: `fieldname-timestamp-randomnumber.extension`
- Example: `logo-1703123456789-123456789.jpg`

## Error Handling

- File type validation (images only)
- File size limits (5MB)
- Network error handling
- Proper error messages displayed to users

## Security Considerations

- Only image files are accepted
- File size is limited to prevent abuse
- Unique filenames prevent conflicts
- Files are served from a dedicated directory

## API Endpoints

### Upload Endpoints

```
POST /api/markets/upload-logo
POST /api/products/upload-image
```

### Response Format

```json
{
  "imageUrl": "/uploads/filename.jpg",
  "filename": "filename.jpg"
}
```

### Error Response

```json
{
  "message": "Error message",
  "error": "Detailed error information"
}
```
