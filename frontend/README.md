# Market Products Frontend

A modern React application for browsing and managing market products and companies.

## Features

- **Main Page**: Displays companies with their products grouped by company
- **Company List**: Browse all companies and view their products
- **Product Categories**: Filter and browse products by category
- **Admin Panel**: Add new companies and products
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Material-UI components

## Pages

### 1. Main Page (`/`)

- Shows companies grouped by company
- Each company displays up to 10 products
- Links to company profiles and product details
- "More Products" button for each company

### 2. Company List (`/companies`)

- Displays all companies in a grid layout
- Click to view company details and products
- Modal dialog shows company products

### 3. Product Categories (`/categories`)

- Tabbed interface for different product categories
- Filter products by category
- Product detail dialogs

### 4. Admin Panel (`/admin`)

- Add new companies
- Add new products
- Form validation and error handling

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm start
   ```

3. **Make sure the backend is running** on `http://localhost:5000`

## Technologies Used

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Material-UI**: Beautiful UI components
- **Axios**: HTTP client for API calls
- **CSS-in-JS**: Styled components with emotion

## Project Structure

```
src/
├── components/          # Reusable components
├── pages/              # Page components
│   ├── MainPage.js
│   ├── MarketList.js
│   ├── MarketProfile.js
│   ├── ProductCategory.js
│   └── DataEntryForm.js
├── services/           # API services
│   └── api.js
├── App.js              # Main app component
└── index.js            # Entry point
```

## API Integration

The frontend communicates with the backend API at `http://localhost:5000/api`:

- **Markets**: GET, POST operations
- **Products**: GET, POST operations with filtering
- **Categories**: GET all categories
- **Error Handling**: Comprehensive error handling and loading states

## Development

- **Hot Reload**: Changes automatically refresh in the browser
- **Proxy**: Configured to proxy API calls to backend
- **ESLint**: Code quality and consistency
- **Responsive**: Mobile-first design approach

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.
