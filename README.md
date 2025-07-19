# Market Products Website

A full-stack web application for managing and displaying market products and markets. Built with React (frontend), Node.js/Express (backend), and MongoDB (database).

## 🚀 Features

### Frontend (React)

- **Main Page**: Markets with their products grouped by market
- **Market List**: Browse all markets and view their products
- **Product Categories**: Filter products by category
- **Admin Panel**: Add new markets and products
- **Responsive Design**: Works on all devices
- **Modern UI**: Beautiful Material-UI components

### Backend (Node.js/Express)

- **RESTful API**: Clean and intuitive endpoints
- **MongoDB Integration**: Robust data persistence
- **CRUD Operations**: Full create, read, update, delete functionality
- **Error Handling**: Comprehensive error management
- **Data Validation**: Input validation and sanitization

## 📁 Project Structure

```
market-products/
├── backend/                 # Node.js/Express API
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── controllers/
│   │   ├── marketController.js
│   │   └── productController.js
│   ├── models/
│   │   ├── Market.js
│   │   └── Product.js
│   ├── routes/
│   │   ├── market.js
│   │   └── product.js
│   ├── server.js          # Express server
│   ├── test-api.js        # API test script
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MainPage.js
│   │   │   ├── MarketList.js
│   │   │   ├── MarketProfile.js
│   │   │   ├── ProductCategory.js
│   │   │   └── DataEntryForm.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   └── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
echo "MONGO_URI=mongodb://localhost:27017/marketdb
PORT=5000" > .env

# Start the server
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### 3. Database Setup

Make sure MongoDB is running locally or update the `MONGO_URI` in the backend `.env` file to point to your MongoDB instance.

## 🎯 API Endpoints

### Markets

- `GET /api/markets` - Get all markets
- `GET /api/markets/:id` - Get market by ID
- `POST /api/markets` - Create new market

### Products

- `GET /api/products` - Get all products (with optional filters)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `GET /api/products/company/:companyId` - Get products by market
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/categories` - Get all categories

## 📊 Database Schema

### Market

```javascript
{
  _id: ObjectId,
  name: String (required),
  logo: String,
  address: String,
  phone: String,
  description: String
}
```

### Product

```javascript
{
  _id: ObjectId,
  name: String (required),
  type: String (required), // category
  image: String,
  previousPrice: Number,
  newPrice: Number,
  companyId: ObjectId (ref to Market, required),
  expireDate: Date
}
```

## 🎨 Frontend Pages

### 1. Main Page (`/`)

- Displays markets grouped by market
- Each market shows up to 10 products
- Links to market profiles and product details
- "More Products" button for each market

### 2. Market List (`/markets`)

- Grid layout of all markets
- Click to view market details and products
- Modal dialog for market products

### 3. Product Categories (`/categories`)

- Tabbed interface for product categories
- Filter products by category
- Product detail dialogs

### 4. Admin Panel (`/admin`)

- Add new markets
- Add new products
- Form validation and error handling

## 🧪 Testing

### Backend Testing

```bash
cd backend
node test-api.js
```

### Frontend Testing

```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Set up environment variables
2. Deploy to Heroku, Vercel, or your preferred platform
3. Update MongoDB connection string

### Frontend Deployment

```bash
cd frontend
npm run build
```

Deploy the `build` folder to your hosting platform.

## 🛡️ Security Features

- Input validation
- Error handling
- CORS configuration
- Data sanitization

## 🔧 Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development

```bash
cd frontend
npm start    # Starts development server with hot reload
```

## 📱 Responsive Design

The frontend is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones

## 🎯 Key Features Implemented

✅ **Main Page**: Markets with products grouped by market  
✅ **Market List**: Browse all markets and their products  
✅ **Product Categories**: Filter products by category  
✅ **Admin Panel**: Add markets and products  
✅ **Responsive Design**: Works on all devices  
✅ **Modern UI**: Material-UI components  
✅ **API Integration**: Full CRUD operations  
✅ **Error Handling**: Comprehensive error management  
✅ **Loading States**: User-friendly loading indicators  
✅ **Data Validation**: Form validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy coding! 🚀**
